'use strict';

const reportEmailSender = require('./reportEmailSender'),
    reportWebhookSender = require('./reportWebhookSender'),
    jobsManager = require('../../jobs/models/jobManager'),
    statsFromatter = require('../../webhooks/models/statsFormatter'),
    aggregateReportGenerator = require('./aggregateReportGenerator'),
    logger = require('../../common/logger'),
    constants = require('../utils/constants'),
    configHandler = require('../../configManager/models/configHandler'),
    reportUtil = require('../utils/reportUtil'),
    reportsManager = require('./reportsManager'),
    webhooksManager = require('../../webhooks/models/webhookManager');
const {
    CONFIG: configConstants,
    WEBHOOK_EVENT_TYPE_STARTED,
    WEBHOOK_EVENT_TYPE_FAILED,
    WEBHOOK_EVENT_TYPE_FINISHED,
    WEBHOOK_EVENT_TYPE_ABORTED,
    WEBHOOK_EVENT_TYPE_BENCHMARK_FAILED,
    WEBHOOK_EVENT_TYPE_BENCHMARK_PASSED,
    WEBHOOK_EVENT_TYPE_IN_PROGRESS
} = require('../../common/consts');

module.exports.notifyIfNeeded = async (report, stats, reportBenchmark = {}) => {
    let job;
    const metadata = { testId: report.test_id, reportId: report.report_id };
    try {
        job = await jobsManager.getJob(report.job_id);
        switch (stats.phase_status) {
            case constants.SUBSCRIBER_FAILED_STAGE: {
                logger.info(metadata, stats.error, 'handling error message');
                await webhooksManager.fireWebhookByEvent(job.id, WEBHOOK_EVENT_TYPE_FAILED, { report, stats });
                break;
            }
            case constants.SUBSCRIBER_STARTED_STAGE: {
                logger.info(metadata, 'handling started message');
                await handleStart(report, job);
                break;
            }
            case constants.SUBSCRIBER_FIRST_INTERMEDIATE_STAGE: {
                logger.info(metadata, 'handling intermediate message');
                await handleFirstIntermediate(report, job);
                break;
            }
            case constants.SUBSCRIBER_DONE_STAGE: {
                logger.info(metadata, 'handling done message');
                await handleDone(report, job, reportBenchmark);
                break;
            }
            case constants.SUBSCRIBER_ABORTED_STAGE: {
                logger.info(metadata, 'handling aborted message');
                await handleAbort(report, job);
                break;
            }
            default: {
                logger.trace(metadata, 'Handling unsupported test status: ' + JSON.stringify(stats));
                break;
            }
        }
    } catch (err) {
        logger.error(err, `Failed to notify for testId ${report.test_id} with reportID ${report.report_id}`);
    }
};

async function handleStart(report, job) {
    if (!reportUtil.isAllRunnersInExpectedPhase(report, constants.SUBSCRIBER_STARTED_STAGE)) {
        return;
    }
    await webhooksManager.fireWebhookByEvent(job.id, WEBHOOK_EVENT_TYPE_STARTED, { report });
}

async function handleFirstIntermediate(report, job) {
    if (!reportUtil.isAllRunnersInExpectedPhase(report, constants.SUBSCRIBER_FIRST_INTERMEDIATE_STAGE)) {
        return;
    }
    // WHAT DO WE DO WITH BATCHES
    let aggregatedReport = await aggregateReportGenerator.createAggregateReport(report.test_id, report.report_id);
    webhooksManager.fireWebhookByEvent(job.id, WEBHOOK_EVENT_TYPE_IN_PROGRESS, { report, aggregatedReport });
}

async function handleDone(report, job, reportBenchmark) {
    if (!reportUtil.isAllRunnersInExpectedPhase(report, constants.SUBSCRIBER_DONE_STAGE)) {
        return;
    }
    let emails = await getEmailTargets(job);
    const { benchmarkThreshold, benchmarkWebhook } = await getBenchmarkConfig();

    if (emails.length === 0 && benchmarkWebhook.length === 0) {
        return;
    }

    let aggregatedReport = await aggregateReportGenerator.createAggregateReport(report.test_id, report.report_id);

    if (emails.length > 0) {
        reportEmailSender.sendAggregateReport(aggregatedReport, job, emails, reportBenchmark);
    }

    await webhooksManager.fireWebhookByEvent(job.id, WEBHOOK_EVENT_TYPE_FINISHED, { report, aggregatedReport, reportBenchmark });

    if (reportBenchmark.score && benchmarkThreshold) {
        const lastReports = await reportsManager.getReports(aggregatedReport.test_id);
        const lastScores = lastReports.slice(0, 3).filter(report => report.score).map(report => report.score.toFixed(1));
        let event = reportBenchmark.score < benchmarkThreshold ? WEBHOOK_EVENT_TYPE_BENCHMARK_FAILED : WEBHOOK_EVENT_TYPE_BENCHMARK_PASSED;
        await webhooksManager.fireWebhookByEvent(job.id, event, { aggregatedReport, score: reportBenchmark.score, lastScores, icon: ':sad_1:' });
    }
}

async function handleAbort(report, job) {
    await webhooksManager.fireWebhookByEvent(job.id, WEBHOOK_EVENT_TYPE_ABORTED, { report });
}

async function getWebhookTargets(job) {
    let targets = [];
    let defaultWebhookUrl = await configHandler.getConfigValue(configConstants.DEFAULT_WEBHOOK_URL);

    if (defaultWebhookUrl) {
        targets.push(defaultWebhookUrl);
    }

    if (job.webhooks) {
        targets = targets.concat(job.webhooks);
    }
    return targets;
}

async function getBenchmarkConfig() {
    const benchmarkWebhook = await configHandler.getConfigValue(configConstants.BENCHMARK_THRESHOLD_WEBHOOK_URL);
    const benchmarkThreshold = await configHandler.getConfigValue(configConstants.BENCHMARK_THRESHOLD);
    return { benchmarkThreshold, benchmarkWebhook };
}

async function getEmailTargets(job) {
    let targets = [];
    let defaultEmailAddress = await configHandler.getConfigValue(configConstants.DEFAULT_EMAIL_ADDRESS);

    if (defaultEmailAddress) {
        targets.push(defaultEmailAddress);
    }

    if (job.emails) {
        targets = targets.concat(job.emails);
    }
    return targets;
}
