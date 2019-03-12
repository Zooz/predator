'use strict';

const reportEmailSender = require('./reportEmailSender'),
    reportWebhookSender = require('./reportWebhookSender'),
    reportsManager = require('./reportsManager'),
    jobsManager = require('../../jobs/models/jobManager'),
    statsFromatter = require('./statsFormatter'),
    configHandler = require('../../configManager/models/configHandler'),
    logger = require('../../common/logger'),
    constants = require('../utils/constants');

module.exports.notifyIfNeeded = async (testId, reportId, stats) => {
    const metadata = { testId: testId, reportId: reportId };
    const report = await reportsManager.getReport(testId, reportId);
    const job = await jobsManager.getJob(report.job_id);
    const statsData = JSON.parse(stats.data);
    const statsTime = new Date(Number(stats.stats_time));
    switch (stats.phase_status) {
    case 'error':
        logger.info(metadata, stats.error, 'handling error message');
        await handleError(report, job, stats);
        break;
    case 'started_phase':
        logger.info(metadata, statsData, 'handling started message');
        await handleStart(report, job);
        break;
    case 'intermediate':
        logger.info(metadata, 'handling intermediate message');
        await handleIntermediate(report, job, stats, statsTime, statsData);
        break;
    case 'done':
        logger.info(metadata, 'handling done message');
        await handleDone(report, job, stats, statsTime, statsData);
        break;
    case 'aborted':
        logger.info(metadata, 'handling aborted message');
        await handleAbort(report, job);
        break;
    default:
        logger.warn(metadata, 'Handling unsupported test status: ' + JSON.stringify(stats));
        break;
    }

    return Promise.resolve();
};

async function handleError(report, job, stats) {
    const webhookMessage = `😞 *Test with id: ${report.test_id} Failed*.\ntest configuration:\nenvironment: ${report.environment}\n${stats.data}`;
    if (job.webhooks) {
        reportWebhookSender.send(report.test_id, report.report_id, webhookMessage, job.webhooks);
    }
}

async function handleStart(report, job) {
    let webhookMessage;
    if (report.status === constants.REPORT_INITIALIZING_STATUS) {
        let rampToMessage = report.ramp_to ? `, ramp to: ${report.ramp_to} scenarios per second` : '';
        let parallelism = report.parallelism || 1;
        webhookMessage = `🤓 *Test ${report.test_name} with id: ${report.test_id} has started*.\n
         *test configuration:* environment: ${report.environment} duration: ${report.duration} seconds, arrival rate: ${report.arrival_rate} scenarios per second, number of runners: ${parallelism}${rampToMessage}`;
    }

    if (job.webhooks && webhookMessage) {
        reportWebhookSender.send(report.test_id, report.report_id, webhookMessage, job.webhooks);
    }
}

async function handleIntermediate(report, job, stats, statsTime, statsData) {
    let webhookMessage;
    const configData = await configHandler.getConfig();

    if (report && report.status === constants.REPORT_STARTED_STATUS) {
        let htmlReportUrl = configData.external_address + `/tests/${report.test_id}/reports/${report.report_id}/html`;
        const phaseIndex = report.phase;
        webhookMessage = `🤔 *Test ${report.test_name} with id: ${report.test_id} first batch of results arrived for phase ${phaseIndex}.*\n${statsFromatter.getStatsFormatted('intermediate', statsData)}\n<${htmlReportUrl}|Track report in html report>\n`;
        if (report.grafana_report) {
            webhookMessage += `<${report.grafana_report}|Track report in grafana dashboard>`;
        }
    }
    if (job.webhooks && webhookMessage) {
        reportWebhookSender.send(report.test_id, report.report_id, webhookMessage, job.webhooks);
    }
}

async function handleDone(report, job, stats, statsTime, statsData) {
    const configData = await configHandler.getConfig();

    const htmlReportUrl = configData.external_address + `/tests/${report.test_id}/reports/${report.report_id}/html`;
    let webhookMessage = `😎 *Test ${report.test_name} with id: ${report.test_id} is finished.*\n${statsFromatter.getStatsFormatted('aggregate', statsData)}\n<${htmlReportUrl}|View final html report>\n`;

    if (report.grafana_report) {
        webhookMessage += `<${report.grafana_report}|View final grafana dashboard report>`;
    }

    if (job.emails) {
        reportEmailSender.sendAggregateReport(report.test_id, report.report_id, htmlReportUrl, report.grafana_report);
    }
    if (job.webhooks) {
        reportWebhookSender.send(report.test_id, report.report_id, webhookMessage, job.webhooks);
    }
}

async function handleAbort(report, job) {
    const configData = await configHandler.getConfig();

    if (job.webhooks) {
        const htmlReportUrl = configData.external_address + `/tests/${report.test_id}/reports/${report.report_id}/html`;
        let webhookMessage = `😢 *Test ${report.test_name} with id: ${report.test_id} was aborted.*\n<${htmlReportUrl}|View final html report>\n`;
        if (report.grafana_report) {
            webhookMessage += `<${report.grafana_report}|View final grafana dashboard report>`;
        }
        reportWebhookSender.send(report.test_id, report.report_id, webhookMessage, job.webhooks);
    }
}