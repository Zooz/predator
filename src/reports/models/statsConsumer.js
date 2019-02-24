'use strict';

let uuidv4 = require('uuid/v4');

let databaseConnector = require('./databaseConnector');
let reportEmailSender = require('./reportEmailSender');
let reportWebhookSender = require('./reportWebhookSender');
let reportsManager = require('./reportsManager');
let jobsManager = require('../../jobs/models/jobManager');
let statsFromatter = require('./statsFormatter');
let serviceConfig = require('../../config/serviceConfig');
let logger = require('../../common/logger');

module.exports.handleMessage = async (testId, reportId, stats) => {
    const metadata = { testId: testId, reportId: reportId };
    const report = await reportsManager.getReport(testId, reportId);
    const job = await jobsManager.getJob(report.job_id);
    const statsData = JSON.parse(stats.data);
    const statsTime = new Date(Number(stats.stats_time));
    switch (stats.phase_status) {
    case 'error':
        logger.info(metadata, stats.error, 'handling error message');
        await handleError(report, job, stats, statsTime);
        break;
    case 'started_phase':
        logger.info(metadata, statsData, 'handling started message');
        await handleStart(report, job, stats);
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
        await handleAbort(report, job, stats, statsTime);
        break;
    default:
        logger.warn(metadata, 'Handling unsupported test status: ' + JSON.stringify(stats));
        break;
    }

    return Promise.resolve();
};

async function handleError(report, job, stats, statsTime) {
    await databaseConnector.updateReport(report.test_id, report.report_id, 'failed', report.phase, stats.data, statsTime);
    const webhookMessage = `😞 *Test with id: ${report.test_id} Failed*.\ntest configuration:\nenvironment: ${report.environment}\n${stats.data}`;
    if (job.webhooks) {
        reportWebhookSender.send(report.test_id, report.report_id, webhookMessage, job.webhooks);
    }
}

async function handleStart(report, job, stats) {
    let webhookMessage;
    let reportStatus = report.status === 'initialized' ? 'started' : 'in_progress';
    if (reportStatus === 'started') {
        let rampToMessage = report.ramp_to ? `, ramp to: ${report.ramp_to} scenarios per second` : '';
        let parallelism = report.parallelism || 1;
        webhookMessage = `🤓 *Test ${report.test_name} with id: ${report.test_id} has started*.\n
         *test configuration:* environment: ${report.environment} duration: ${report.duration} seconds, arrival rate: ${report.arrival_rate} scenarios per second, number of runners: ${parallelism}${rampToMessage}`;
    }
    await databaseConnector.updateReport(report.test_id, report.report_id, reportStatus, stats.phase_index, undefined, undefined);
    if (job.webhooks && webhookMessage) {
        reportWebhookSender.send(report.test_id, report.report_id, webhookMessage, job.webhooks);
    }
}

async function handleIntermediate(report, job, stats, statsTime, statsData) {
    let webhookMessage;
    await databaseConnector.updateReport(report.test_id, report.report_id, 'in_progress', report.phase, stats.data, undefined);
    await databaseConnector.insertStats(stats.container_id, report.test_id, report.report_id, uuidv4(), statsTime, report.phase, 'intermediate', stats.data);

    if (report && report.status === ('started')) {
        let htmlReportUrl = serviceConfig.externalAddress + `/tests/${report.test_id}/reports/${report.report_id}/html`;
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
    await databaseConnector.insertStats(stats.container_id, report.test_id, report.report_id, uuidv4(), statsTime, report.phase, 'aggregate', stats.data);
    await databaseConnector.updateReport(report.test_id, report.report_id, 'finished', report.phase, stats.data, statsTime);

    const htmlReportUrl = serviceConfig.externalAddress + `/tests/${report.test_id}/reports/${report.report_id}/html`;
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

async function handleAbort(report, job, stats, statsTime) {
    await databaseConnector.updateReport(report.test_id, report.report_id, 'aborted', report.phase, undefined, statsTime);

    if (job.webhooks) {
        const htmlReportUrl = serviceConfig.externalAddress + `/tests/${report.test_id}/reports/${report.report_id}/html`;
        let webhookMessage = `😢 *Test ${report.test_name} with id: ${report.test_id} was aborted.*\n<${htmlReportUrl}|View final html report>\n`;
        if (report.grafana_report) {
            webhookMessage += `<${report.grafana_report}|View final grafana dashboard report>`;
        }
        reportWebhookSender.send(report.test_id, report.report_id, webhookMessage, job.webhooks);
    }
}