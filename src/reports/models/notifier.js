'use strict';

const reportEmailSender = require('./reportEmailSender'),
    reportWebhookSender = require('./reportWebhookSender'),
    jobsManager = require('../../jobs/models/jobManager'),
    statsFromatter = require('./statsFormatter'),
    aggregateReportGenerator = require('./aggregateReportGenerator'),
    logger = require('../../common/logger'),
    constants = require('../utils/constants'),
    configHandler = require('../../configManager/models/configHandler'),
    reportUtil=require('../utils/reportUtil'),
    configConstants = require('../../common/consts').CONFIG;

module.exports.notifyIfNeeded = async (report, stats) => {
    let job;
    const metadata = { testId: report.test_id, reportId: report.report_id };
    try {
        job = await jobsManager.getJob(report.job_id);
        switch (stats.phase_status) {
        case constants.SUBSCRIBER_FAILED_STAGE:
            logger.info(metadata, stats.error, 'handling error message');
            await handleError(report, job, stats);
            break;
        case constants.SUBSCRIBER_STARTED_STAGE:
            logger.info(metadata, 'handling started message');
            await handleStart(report, job);
            break;
        case constants.SUBSCRIBER_FIRST_INTERMEDIATE_STAGE:
            logger.info(metadata, 'handling intermediate message');
            await handleFirstIntermediate(report, job);
            break;
        case constants.SUBSCRIBER_DONE_STAGE:
            logger.info(metadata, 'handling done message');
            await handleDone(report, job);
            break;
        case constants.SUBSCRIBER_ABORTED_STAGE:
            logger.info(metadata, 'handling aborted message');
            await handleAbort(report, job);
            break;
        default:
            logger.trace(metadata, 'Handling unsupported test status: ' + JSON.stringify(stats));
            break;
        }
    } catch (err) {
        logger.error(err, `Failed to notify for testId ${report.test_id} with reportID ${report.report_id}`);
    }
};

async function handleError(report, job, stats) {
    let webhooks = await getWebhookTargets(job);
    if (webhooks.length === 0) {
        return;
    }

    const webhookMessage = `😞 *Test with id: ${report.test_id} Failed*.\ntest configuration:\nenvironment: ${report.environment}\n${stats.data}`;
    reportWebhookSender.send(webhooks, webhookMessage);
}

async function handleStart(report, job) {
    if (!reportUtil.isAllRunnersInExpectedPhase(report, constants.SUBSCRIBER_STARTED_STAGE)) {
        return;
    }

    let webhooks = await getWebhookTargets(job);
    if (webhooks.length === 0) {
        return;
    }

    let webhookMessage;
    let rampToMessage = report.ramp_to ? `, ramp to: ${report.ramp_to} scenarios per second` : '';
    let parallelism = report.parallelism || 1;
    webhookMessage = `🤓 *Test ${report.test_name} with id: ${report.test_id} has started*.\n
     *test configuration:* environment: ${report.environment} duration: ${report.duration} seconds, arrival rate: ${report.arrival_rate} scenarios per second, number of runners: ${parallelism}${rampToMessage}`;

    reportWebhookSender.send(webhooks, webhookMessage);
}

async function handleFirstIntermediate(report, job) {
    if (!reportUtil.isAllRunnersInExpectedPhase(report, constants.SUBSCRIBER_FIRST_INTERMEDIATE_STAGE)) {
        return;
    }
    let webhooks = await getWebhookTargets(job);
    if (webhooks.length === 0) {
        return;
    }

    let webhookMessage;
    let aggregatedReport = await aggregateReportGenerator.createAggregateReport(report.test_id, report.report_id);
    const phaseIndex = report.phase;
    webhookMessage = `🤔 *Test ${report.test_name} with id: ${report.test_id} first batch of results arrived for phase ${phaseIndex}.*\n${statsFromatter.getStatsFormatted('intermediate', aggregatedReport.aggregate)}\n`;
    if (report.grafana_report) {
        webhookMessage += `<${report.grafana_report}|Track report in grafana dashboard>`;
    }
    reportWebhookSender.send(webhooks, webhookMessage);
}

async function handleDone(report, job) {
    if (!reportUtil.isAllRunnersInExpectedPhase(report, constants.SUBSCRIBER_DONE_STAGE)) {
        return;
    }

    let emails = await getEmailTargets(job);
    let webhooks = await getWebhookTargets(job);

    if (emails.length === 0 && webhooks.length === 0) {
        return;
    }

    let aggregatedReport = await aggregateReportGenerator.createAggregateReport(report.test_id, report.report_id);
    let webhookMessage = `😎 *Test ${report.test_name} with id: ${report.test_id} is finished.*\n${statsFromatter.getStatsFormatted('aggregate', aggregatedReport.aggregate)}\n`;

    if (report.grafana_report) {
        webhookMessage += `<${report.grafana_report}|View final grafana dashboard report>`;
    }

    if (emails.length > 0) {
        reportEmailSender.sendAggregateReport(aggregatedReport, job, emails);
    }

    if (webhooks.length > 0) {
        reportWebhookSender.send(webhooks, webhookMessage);
    }
}

async function handleAbort(report, job) {
    let webhooks = await getWebhookTargets(job);
    if (webhooks.length === 0) {
        return;
    }
    let webhookMessage = `😢 *Test ${report.test_name} with id: ${report.test_id} was aborted.*\n`;
    if (report.grafana_report) {
        webhookMessage += `<${report.grafana_report}|View final grafana dashboard report>`;
    }
    reportWebhookSender.send(webhooks, webhookMessage);
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
