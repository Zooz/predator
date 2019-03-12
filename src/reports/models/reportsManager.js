'use strict';

const _ = require('lodash');

const databaseConnector = require('./databaseConnector'),
    jobConnector = require('../../jobs/models/jobManager'),
    configHandler = require('../../configManager/models/configHandler'),
    statsConsumer = require('./statsConsumer'),
    constants = require('../utils/constants');

const MINIMUM_WAIT_FOR_DELAYED_REPORT_UPDATE_MS = 30000;

module.exports.getReport = async (testId, reportId) => {
    let reportSummary = await databaseConnector.getReport(testId, reportId);

    if (reportSummary.length !== 1) {
        let error = new Error('Report not found');
        error.statusCode = 404;
        throw error;
    }
    let config = await configHandler.getConfig();
    let report = getReportResponse(reportSummary[0], config);
    return report;
};

module.exports.getReports = async (testId) => {
    let reportSummaries = await databaseConnector.getReports(testId);
    let config = await configHandler.getConfig();
    let reports = reportSummaries.map((summaryRow) => {
        return getReportResponse(summaryRow, config);
    });
    return reports;
};

module.exports.getLastReports = async (limit) => {
    let reportSummaries = await databaseConnector.getLastReports(limit);
    let config = await configHandler.getConfig();
    let reports = reportSummaries.map((summaryRow) => {
        return getReportResponse(summaryRow, config);
    });
    return reports;
};

module.exports.postReport = async (testId, reportBody) => {
    const startTime = new Date(Number(reportBody.start_time));
    const job = await jobConnector.getJob(reportBody.job_id);

    const testConfiguration = {
        arrival_rate: job.arrival_rate,
        duration: job.duration,
        ramp_to: job.ramp_to,
        parallelism: job.parallelism || 1,
        max_virtual_users: job.max_virtual_users,
        environment: job.environment
    };

    await databaseConnector.insertReport(testId, reportBody.revision_id, reportBody.report_id, reportBody.job_id,
        reportBody.test_type, startTime, reportBody.test_name,
        reportBody.test_description, JSON.stringify(testConfiguration), job.notes);
    await databaseConnector.subscribeRunner(testId, reportBody.report_id, reportBody.runner_id);
    return reportBody;
};

module.exports.postStats = async (testId, reportId, stats) => {
    await databaseConnector.updateSubscribers(testId, reportId, stats.runner_id, stats.phase_status);
    await statsConsumer.handleMessage(testId, reportId, stats);
    return stats;
};

function getReportResponse(summaryRow, config) {
    let timeEndOrCurrent = summaryRow.end_time || new Date();

    let testConfiguration = summaryRow.test_configuration ? JSON.parse(summaryRow.test_configuration) : {};
    let lastStats = summaryRow.last_stats ? JSON.parse(summaryRow.last_stats) : {};

    let htmlReportUrl = config.external_address + `/tests/${summaryRow.test_id}/reports/${summaryRow.report_id}/html`;

    let report = {
        test_id: summaryRow.test_id,
        test_name: summaryRow.test_name,
        revision_id: summaryRow.revision_id,
        report_id: summaryRow.report_id,
        job_id: summaryRow.job_id,
        test_type: summaryRow.test_type,
        start_time: summaryRow.start_time,
        end_time: summaryRow.end_time || undefined,
        phase: summaryRow.phase,
        duration_seconds: (new Date(timeEndOrCurrent).getTime() - new Date(summaryRow.start_time).getTime()) / 1000,
        avg_response_time_ms: lastStats.latency ? lastStats.latency.median : undefined,
        arrival_rate: testConfiguration.arrival_rate,
        duration: testConfiguration.duration,
        ramp_to: testConfiguration.ramp_to,
        parallelism: testConfiguration.parallelism,
        max_virtual_users: testConfiguration.max_virtual_users,
        status: summaryRow.status,
        last_stats: lastStats,
        html_report: htmlReportUrl,
        grafana_report: generateGraphanaUrl(summaryRow, config.grafana_url),
        notes: summaryRow.notes,
        environment: testConfiguration.environment,
        subscribers: summaryRow.subscribers
    };

    return report;
}

function generateGraphanaUrl(report, grafanaUrl) {
    if (grafanaUrl) {
        const endTimeGrafanafaQuery = report.end_time ? `&to=${new Date(report.end_time).getTime()}` : '';
        const grafanaReportUrl = encodeURI(grafanaUrl + `&var-Name=${report.test_name}&from=${new Date(report.start_time).getTime()}${endTimeGrafanafaQuery}`);
        return grafanaReportUrl;
    }
}

module.exports.updateReport = async (report, status, stats, statsTime) => {
    const delayedTimeInMs = Math.max(report.duration * 0.01, MINIMUM_WAIT_FOR_DELAYED_REPORT_UPDATE_MS);

    const subscribersStages = getListOfSubscribersStages(report);
    const uniqueSubscribersStages = _.uniq(subscribersStages);
    if (status === constants.REPORT_IN_PROGRESS_STATUS) {
        await databaseConnector.updateReport(report.test_id, report.report_id, constants.REPORT_IN_PROGRESS_STATUS, report.phase, stats.data, undefined);
    } else if (status === constants.REPORT_STARTED_STATUS && report.status === constants.REPORT_INITIALIZING_STATUS) {
        await databaseConnector.updateReport(report.test_id, report.report_id, constants.REPORT_STARTED_STATUS, report.phase, undefined, undefined);
    } else if (status === constants.REPORT_ABORTED_STATUS && allSubscribersAborted(uniqueSubscribersStages)) {
        await databaseConnector.updateReport(report.test_id, report.report_id, constants.REPORT_ABORTED_STATUS, report.phase, stats.data, statsTime);
    } else if (status === constants.REPORT_FAILED_STATUS && allSubscribersFailed(uniqueSubscribersStages)) {
        await databaseConnector.updateReport(report.test_id, report.report_id, constants.REPORT_FAILED_STATUS, report.phase, stats.data, statsTime);
    } else if (status === constants.REPORT_FINISHED_STATUS) {
        if (allSubscribersFinished(uniqueSubscribersStages)) {
            await updateFinishedReportStatus(uniqueSubscribersStages, report, stats, statsTime);
        } else {
            setTimeout(async () => {
                await delayedUpdateOfReportStatus(report, stats, statsTime);
            }, delayedTimeInMs);
        }
    }
};

function getListOfSubscribersStages (report) {
    const runnerStates = report.subscribers.map((subscriber) => subscriber.stage);
    return runnerStates;
}

function allSubscribersFinished (subscriberStages) {
    return !(subscriberStages.includes(constants.SUBSCRIBER_INTERMEDIATE_STAGE) || subscriberStages.includes(constants.SUBSCRIBER_STARTED_STAGE));
}

function allSubscribersAborted (subscriberStages) {
    return subscriberStages.length === 1 && subscriberStages[0] === constants.SUBSCRIBER_ABORTED_STAGE;
}

function allSubscribersFailed (subscriberStages) {
    return subscriberStages.length === 1 && subscriberStages[0] === constants.SUBSCRIBER_FAILED_STAGE;
}

async function updateFinishedReportStatus (uniqueSubscribersStages, report, stats, statsTime) {
    if (uniqueSubscribersStages.length === 1) {
        await databaseConnector.updateReport(report.test_id, report.report_id, constants.REPORT_FINISHED_STATUS, report.phase, stats.data, statsTime);
    } else {
        await databaseConnector.updateReport(report.test_id, report.report_id, constants.REPORT_PARTIALLY_FINISHED_STATUS, report.phase, stats.data, statsTime);
    }
}

async function delayedUpdateOfReportStatus (report, stats, statsTime) {
    const mostUpToDateReportVersion = await module.exports.getReport(report.test_id, report.report_id);
    const subscribersStages = getListOfSubscribersStages(mostUpToDateReportVersion);
    const uniqueSubscribersStages = _.uniq(subscribersStages);
    if (mostUpToDateReportVersion.status !== constants.REPORT_FINISHED_STATUS && uniqueSubscribersStages.length === 1 && uniqueSubscribersStages[0] === constants.SUBSCRIBER_DONE_STAGE) {
        await databaseConnector.updateReport(report.test_id, report.report_id, constants.REPORT_FINISHED_STATUS, report.phase, stats.data, statsTime);
    } else {
        await databaseConnector.updateReport(report.test_id, report.report_id, constants.REPORT_PARTIALLY_FINISHED_STATUS, report.phase, stats.data, statsTime);
    }
}