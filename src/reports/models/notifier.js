'use strict';

const slackEmojis = require('slack-emojis');

const reportEmailSender = require('./reportEmailSender'),
    jobsManager = require('../../jobs/models/jobManager'),
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
    WEBHOOK_EVENT_TYPE_IN_PROGRESS,
    WEBHOOK_EVENT_TYPE_API_FAILURE
} = require('../../common/consts');

module.exports.notifyIfNeeded = async (report, stats, reportBenchmark = {}, context) => {
    let job;
    const metadata = { testId: report.test_id, reportId: report.report_id };
    try {
        job = await jobsManager.getJob(report.job_id);
        switch (stats.phase_status) {
            case constants.SUBSCRIBER_FAILED_STAGE: {
                logger.info(metadata, stats.error, 'handling error message');
                await webhooksManager.fireWebhookByEvent(job, WEBHOOK_EVENT_TYPE_FAILED, report, {}, {}, context);
                break;
            }
            case constants.SUBSCRIBER_STARTED_STAGE: {
                logger.info(metadata, 'handling started message');
                await handleStart(report, job, context);
                break;
            }
            case constants.SUBSCRIBER_FIRST_INTERMEDIATE_STAGE: {
                logger.info(metadata, 'handling intermediate message');
                await handleFirstIntermediate(report, job, context);
                break;
            }
            case constants.SUBSCRIBER_DONE_STAGE: {
                logger.info(metadata, 'handling done message');
                await handleDone(report, job, reportBenchmark, context);
                break;
            }
            case constants.SUBSCRIBER_ABORTED_STAGE: {
                logger.info(metadata, 'handling aborted message');
                await handleAbort(report, job, context);
                break;
            }
            case constants.SUBSCRIBER_INTERMEDIATE_STAGE: {
                await handleIntermediate(report, job, context);
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

async function handleStart(report, job, context) {
    if (!reportUtil.isAllRunnersInExpectedPhase(report, constants.SUBSCRIBER_STARTED_STAGE)) {
        return;
    }
    await webhooksManager.fireWebhookByEvent(job, WEBHOOK_EVENT_TYPE_STARTED, report, {}, {}, context);
}

async function handleFirstIntermediate(report, job, context) {
    if (!reportUtil.isAllRunnersInExpectedPhase(report, constants.SUBSCRIBER_FIRST_INTERMEDIATE_STAGE)) {
        return;
    }
    await webhooksManager.fireWebhookByEvent(job, WEBHOOK_EVENT_TYPE_IN_PROGRESS, report, {}, {}, context);
}

async function handleDone(report, job, reportBenchmark, context) {
    if (!reportUtil.isAllRunnersInExpectedPhase(report, constants.SUBSCRIBER_DONE_STAGE)) {
        return;
    }
    const emails = await getEmailTargets(job);
    const { benchmarkThreshold } = await getBenchmarkConfig();

    const aggregatedReport = await aggregateReportGenerator.createAggregateReport(report.test_id, report.report_id);

    if (emails && emails.length > 0) {
        await reportEmailSender.sendAggregateReport(aggregatedReport, job, emails, reportBenchmark);
    }

    if (reportBenchmark.score && benchmarkThreshold) {
        const lastReports = await reportsManager.getReports(aggregatedReport.test_id);
        const lastScores = lastReports.slice(0, 3).filter(report => report.score).map(report => report.score.toFixed(1));
        const { event, icon } = reportBenchmark.score < benchmarkThreshold ? { event: WEBHOOK_EVENT_TYPE_BENCHMARK_FAILED, icon: slackEmojis.CRY } : { event: WEBHOOK_EVENT_TYPE_BENCHMARK_PASSED, icon: slackEmojis.GRIN };
        await webhooksManager.fireWebhookByEvent(job, event, report, { aggregatedReport: aggregatedReport.aggregate, score: reportBenchmark.score, lastScores, benchmarkThreshold }, { icon }, context);
    }
    await webhooksManager.fireWebhookByEvent(job, WEBHOOK_EVENT_TYPE_FINISHED, report, { aggregatedReport: aggregatedReport.aggregate, score: reportBenchmark.score }, { icon: slackEmojis.ROCKET }, context);
}

async function handleAbort(report, job, context) {
    await webhooksManager.fireWebhookByEvent(job, WEBHOOK_EVENT_TYPE_ABORTED, report, {}, {}, context);
}

async function getBenchmarkConfig() {
    const benchmarkWebhook = await configHandler.getConfigValue(configConstants.BENCHMARK_THRESHOLD_WEBHOOK_URL);
    const benchmarkThreshold = await configHandler.getConfigValue(configConstants.BENCHMARK_THRESHOLD);
    return { benchmarkThreshold, benchmarkWebhook };
}

async function handleIntermediate(report, job, context) {
    const reportSubscribers = report.subscribers;
    const accumulatedStatusCodesCounter = reportSubscribers.reduce((accumulated, { last_stats: { codes: statusCodesCounter } }) => {
        const statusCodes = Object.keys(statusCodesCounter);
        for (const statusCode of statusCodes) {
            if (!accumulated[statusCode]) {
                accumulated[statusCode] = 0;
            }
            accumulated[statusCode] += Number(statusCodesCounter[statusCode]);
        }
        return accumulated;
    }, {});
    // if there are no stats that have a status code of >= 500, do nothing
    if (Object.keys(accumulatedStatusCodesCounter).every(statusCode => statusCode < 500)) {
        return;
    }
    await webhooksManager.fireWebhookByEvent(job, WEBHOOK_EVENT_TYPE_API_FAILURE, report, { accumulatedStatusCodesCounter }, { icon: slackEmojis.SKULL }, context);
}

async function getEmailTargets(job) {
    let targets = [];
    const defaultEmailAddress = await configHandler.getConfigValue(configConstants.DEFAULT_EMAIL_ADDRESS);

    if (defaultEmailAddress) {
        targets.push(defaultEmailAddress);
    }

    if (job.emails) {
        targets = targets.concat(job.emails);
    }
    return targets;
}
