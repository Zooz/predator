'use strict';

const reportEmailSender = require('./reportEmailSender'),
    reportWebhookSender = require('./reportWebhookSender'),
    jobsManager = require('../../jobs/models/jobManager'),
    statsFromatter = require('./statsFormatter'),
    logger = require('../../common/logger'),
    constants = require('../utils/constants');

module.exports.notifyIfNeeded = async (report, stats) => {
    let job;
    const metadata = { testId: report.test_id, reportId: report.report_id };
    const statsData = JSON.parse(stats.data);
    try {
        job = await jobsManager.getJob(report.job_id);
        switch (stats.phase_status) {
        case 'error':
            logger.info(metadata, stats.error, 'handling error message');
            handleError(report, job, stats);
            break;
        case 'started_phase':
            logger.info(metadata, statsData, 'handling started message');
            handleStart(report, job);
            break;
        case 'intermediate':
            logger.info(metadata, 'handling intermediate message');
            handleIntermediate(report, job, stats, statsData);
            break;
        case 'done':
            logger.info(metadata, 'handling done message');
            handleDone(report, job, stats, statsData);
            break;
        case 'aborted':
            logger.info(metadata, 'handling aborted message');
            handleAbort(report, job);
            break;
        default:
            logger.warn(metadata, 'Handling unsupported test status: ' + JSON.stringify(stats));
            break;
        }
    } catch (err) {
        logger.error(err, `Failed to notify for testID ${report.test_id} with reportID ${report.report_id}`);
    }
};

function handleError(report, job, stats) {
    const webhookMessage = `😞 *Test with id: ${report.test_id} Failed*.\ntest configuration:\nenvironment: ${report.environment}\n${stats.data}`;
    if (job.webhooks) {
        reportWebhookSender.send(job.webhooks, webhookMessage);
    }
}

function handleStart(report, job) {
    let webhookMessage;
    let rampToMessage = report.ramp_to ? `, ramp to: ${report.ramp_to} scenarios per second` : '';
    let parallelism = report.parallelism || 1;
    webhookMessage = `🤓 *Test ${report.test_name} with id: ${report.test_id} has started*.\n
     *test configuration:* environment: ${report.environment} duration: ${report.duration} seconds, arrival rate: ${report.arrival_rate} scenarios per second, number of runners: ${parallelism}${rampToMessage}`;

    if (job.webhooks && webhookMessage) {
        reportWebhookSender.send(job.webhooks, webhookMessage);
    }
}

function handleIntermediate(report, job, stats, statsData) {
    let webhookMessage;

    if (report && report.status === constants.REPORT_STARTED_STATUS && job.webhooks) {
        const phaseIndex = report.phase;
        webhookMessage = `🤔 *Test ${report.test_name} with id: ${report.test_id} first batch of results arrived for phase ${phaseIndex}.*\n${statsFromatter.getStatsFormatted('intermediate', statsData)}\n`;
        if (report.grafana_report) {
            webhookMessage += `<${report.grafana_report}|Track report in grafana dashboard>`;
        }
        reportWebhookSender.send(job.webhooks, webhookMessage);
    }
}

function handleDone(report, job, stats, statsData) {
    let webhookMessage = `😎 *Test ${report.test_name} with id: ${report.test_id} is finished.*\n${statsFromatter.getStatsFormatted('aggregate', statsData)}\n`;

    if (report.grafana_report) {
        webhookMessage += `<${report.grafana_report}|View final grafana dashboard report>`;
    }

    if (job.emails) {
        reportEmailSender.sendAggregateReport(report, job);
    }
    if (job.webhooks) {
        reportWebhookSender.send(job.webhooks, webhookMessage);
    }
}

function handleAbort(report, job) {
    if (job.webhooks) {
        let webhookMessage = `😢 *Test ${report.test_name} with id: ${report.test_id} was aborted.*\n`;
        if (report.grafana_report) {
            webhookMessage += `<${report.grafana_report}|View final grafana dashboard report>`;
        }
        reportWebhookSender.send(job.webhooks, webhookMessage);
    }
}