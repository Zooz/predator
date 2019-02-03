'use strict';

let uuidv4 = require('uuid/v4');

let databaseConnector = require('./databaseConnector');
let reportEmailSender = require('./reportEmailSender');
let reportWebhookSender = require('./reportWebhookSender');
let reports = require('./reports');
let statsFromatter = require('./statsFormatter');
let serviceConfig = require('../../config/serviceConfig');
let logger = require('../../common/logger');

module.exports.handleMessage = async (testId, reportId, stats) => {
    let grafanaReportUrl;
    const metadata = {testId: testId, reportId: reportId};
    const report = await reports.getReport(testId, reportId);
    const statsData = JSON.parse(stats.data);
    const statsTime = new Date(Number(stats.stats_time));
    if (serviceConfig.grafanaUrl) {
        const endTimeGrafanafaQuery = report.end_time ? `&to=${new Date(report.end_time).getTime()}` : undefined;
        grafanaReportUrl = encodeURI(serviceConfig.grafanaUrl + `?var-Name=${report.test_name}&from=${new Date(report.start_time).getTime()}${endTimeGrafanafaQuery}`);
    }

    switch (stats.phase_status) {
    case 'error':
        logger.info(metadata, stats.error, 'handling error message');
        await handleError(report, stats, statsTime);
        break;
    case 'started_phase':
        logger.info(metadata, statsData, 'handling started message');
        await handleStart(report, stats);
        break;
    case 'intermediate':
        logger.info(metadata, 'handling intermediate message');
        await handleIntermediate(report, stats, statsTime, statsData, grafanaReportUrl);
        break;
    case 'done':
        logger.info(metadata, 'handling done message');
        await handleDone(report, stats, statsTime, statsData, grafanaReportUrl);
        break;
    case 'aborted':
        logger.info(metadata, 'handling aborted message');
        await handleAbort(report, stats, statsTime, grafanaReportUrl);
        break;
    default:
        logger.warn(metadata, 'Handling unsupported test status: ' + JSON.stringify(stats));
        break;
    }

    return Promise.resolve();
};

async function handleError(report, stats, statsTime) {
    await databaseConnector.updateReport(report.test_id, report.report_id, 'failed', report.phase, stats.data, statsTime);
    const webhookMessage = `😞 *Test with id: ${report.test_id} Failed*.\ntest configuration:\nenvironment: ${report.environment}\n${stats.data}`;
    if (report.webhooks) {
        reportWebhookSender.send(report.test_id, report.report_id, webhookMessage, report.webhooks);
    }
}

async function handleStart(report, stats) {
    let webhookMessage;
    let reportStatus = report.status === 'initialized' ? 'started' : 'in_progress';
    if (reportStatus === 'started') {
        let rampToMessage = report.ramp_to ? `, ramp to: ${report.ramp_to} scenarios per second` : '';
        webhookMessage = `🤓 *Test ${report.test_name} with id: ${report.test_id} has started*.\n *test configuration:* environment: ${report.environment} duration: ${report.duration} seconds, arrival rate: ${report.arrival_rate} scenarios per second ${rampToMessage}`;
    }
    await databaseConnector.updateReport(report.test_id, report.report_id, reportStatus, stats.phase_index, undefined, undefined);
    if (report.webhooks && webhookMessage) {
        reportWebhookSender.send(report.test_id, report.report_id, webhookMessage, report.webhooks);
    }
}

async function handleIntermediate(report, stats, statsTime, statsData, grafanaReportUrl) {
    let webhookMessage;
    await databaseConnector.updateReport(report.test_id, report.report_id, 'in_progress', report.phase, stats.data, undefined);
    await databaseConnector.insertStats(report.test_id, report.report_id, uuidv4(), statsTime, report.phase, 'intermediate', stats.data);

    if (report && report.status === ('started')) {
        let htmlReportUrl = serviceConfig.myAddress + `/v1/tests/${report.test_id}/reports/${report.report_id}/html`;
        const phaseIndex = report.phase;
        webhookMessage = `🤔 *Test ${report.test_name} with id: ${report.test_id} first batch of results arrived for phase ${phaseIndex}.*\n${statsFromatter.getStatsFormatted('intermediate', statsData)}\n<${htmlReportUrl}|Track report in html report>\n`;
        if (grafanaReportUrl) {
            webhookMessage += `<${grafanaReportUrl}|View final grafana dashboard report>`;
        }
    }
    if (report.webhooks && webhookMessage) {
        reportWebhookSender.send(report.test_id, report.report_id, webhookMessage, report.webhooks);
    }
}

async function handleDone(report, stats, statsTime, statsData, grafanaReportUrl) {
    await databaseConnector.insertStats(report.test_id, report.report_id, uuidv4(), statsTime, report.phase, 'aggregate', stats.data);
    await databaseConnector.updateReport(report.test_id, report.report_id, 'finished', report.phase, stats.data, statsTime);

    const htmlReportUrl = serviceConfig.myAddress + `/v1/tests/${report.test_id}/reports/${report.report_id}/html`;
    let webhookMessage = `😎 *Test ${report.test_name} with id: ${report.test_id} is finished.*\n${statsFromatter.getStatsFormatted('aggregate', statsData)}\n<${htmlReportUrl}|View final html report>\n`;

    if (grafanaReportUrl) {
        webhookMessage += `<${grafanaReportUrl}|View final grafana dashboard report>`;
    }

    if (report.emails) {
        reportEmailSender.sendAggregateReport(report.test_id, report.report_id, htmlReportUrl, grafanaReportUrl);
    }
    if (report.webhooks) {
        reportWebhookSender.send(report.test_id, report.report_id, webhookMessage, report.webhooks);
    }
}

async function handleAbort(report, stats, statsTime, grafanaReportUrl) {
    await databaseConnector.updateReport(report.test_id, report.report_id, 'aborted', report.phase, undefined, statsTime);

    if (report.webhooks) {
        const htmlReportUrl = serviceConfig.myAddress + `/v1/tests/${report.test_id}/reports/${report.report_id}/html`;
        let webhookMessage = `😢 *Test ${report.test_name} with id: ${report.test_id} was aborted.*\n<${htmlReportUrl}|View final html report>\n`;
        if (grafanaReportUrl) {
            webhookMessage += `<${grafanaReportUrl}|View final grafana dashboard report>`;
        }
        reportWebhookSender.send(report.test_id, report.report_id, webhookMessage, report.webhooks);
    }
}