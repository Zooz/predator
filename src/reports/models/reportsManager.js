'use strict';

const _ = require('lodash'),
    uuid = require('uuid/v4');

const databaseConnector = require('./databaseConnector'),
    jobConnector = require('../../jobs/models/jobManager'),
    configHandler = require('../../configManager/models/configHandler'),
    notifier = require('./notifier'),
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
    const phase = '0';

    const testConfiguration = {
        arrival_rate: job.arrival_rate,
        duration: job.duration,
        ramp_to: job.ramp_to,
        parallelism: job.parallelism || 1,
        max_virtual_users: job.max_virtual_users,
        environment: job.environment
    };

    await databaseConnector.insertReport(testId, reportBody.revision_id, reportBody.report_id, reportBody.job_id,
        reportBody.test_type, phase, startTime, reportBody.test_name,
        reportBody.test_description, JSON.stringify(testConfiguration), job.notes, Date.now());
    await databaseConnector.subscribeRunner(testId, reportBody.report_id, reportBody.runner_id);
    return reportBody;
};

module.exports.postStats = async (testId, reportId, stats) => {
    const statsTime = new Date(Number(stats.stats_time));
    await notifier.notifyIfNeeded(testId, reportId, stats);

    await databaseConnector.updateSubscribers(testId, reportId, stats.runner_id, stats.phase_status);
    const report = await module.exports.getReport(testId, reportId);
    await databaseConnector.insertStats(stats.runner_id, report.test_id, report.report_id, uuid(), statsTime, report.phase, stats.phase_status, stats.data);
    await module.exports.updateReport(report, stats);

    return stats;
};

module.exports.updateReport = async (report, stats) => {
    const statsParsed = JSON.parse(stats.data);
    const statsTime = statsParsed.timestamp;
    const reportStatus = calculateReportStatus(report);
    const endTime = reportStatus === constants.REPORT_FINISHED_STATUS || reportStatus === constants.REPORT_PARTIALLY_FINISHED_STATUS
        ? statsTime : undefined;
    await databaseConnector.updateReport(report.test_id, report.report_id, report.phase, statsTime, endTime);
};

function getReportResponse(summaryRow, config) {
    let timeEndOrCurrent = summaryRow.end_time || new Date();

    let testConfiguration = summaryRow.test_configuration ? JSON.parse(summaryRow.test_configuration) : {};

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
        avg_response_time_ms: undefined,
        arrival_rate: testConfiguration.arrival_rate,
        duration: testConfiguration.duration,
        ramp_to: testConfiguration.ramp_to,
        parallelism: testConfiguration.parallelism,
        max_virtual_users: testConfiguration.max_virtual_users,
        last_updated_at: summaryRow.last_updated_at,
        html_report: htmlReportUrl,
        grafana_report: generateGraphanaUrl(summaryRow, config.grafana_url),
        notes: summaryRow.notes,
        environment: testConfiguration.environment,
        subscribers: summaryRow.subscribers
    };

    report.status = calculateReportStatus(report);

    if (report.status === constants.REPORT_FAILED_STATUS || report.status === constants.REPORT_ABORTED_STATUS) {
        report.end_time = report.last_updated_at;
    }
    return report;
}

function generateGraphanaUrl(report, grafanaUrl) {
    if (grafanaUrl) {
        const endTimeGrafanafaQuery = report.end_time ? `&to=${new Date(report.end_time).getTime()}` : '';
        const grafanaReportUrl = encodeURI(grafanaUrl + `&var-Name=${report.test_name}&from=${new Date(report.start_time).getTime()}${endTimeGrafanafaQuery}`);
        return grafanaReportUrl;
    }
}

function calculateReportStatus(report) {
    const subscribersStages = getListOfSubscribersStages(report);
    const uniqueSubscribersStages = _.uniq(subscribersStages);

    const delayedTimeInMs = Math.max(report.duration * 0.01, MINIMUM_WAIT_FOR_DELAYED_REPORT_UPDATE_MS);
    const reportDurationMs = report.duration * 1000;
    const reportStartTimeMs = new Date(report.start_time).getTime();

    if (allSubscribersFinished(uniqueSubscribersStages)) {
        return constants.REPORT_FINISHED_STATUS;
    } else if (Date.now() >= reportStartTimeMs + reportDurationMs + delayedTimeInMs) {
        if (uniqueSubscribersStages.includes(constants.SUBSCRIBER_DONE_STAGE)) {
            return constants.REPORT_PARTIALLY_FINISHED_STATUS;
        } else {
            return constants.REPORT_FAILED_STATUS;
        }
    } else if (allSubscribersInitializing(uniqueSubscribersStages)) {
        return constants.REPORT_INITIALIZING_STATUS;
    } else if (allSubscribersStarted(uniqueSubscribersStages)) {
        return constants.REPORT_STARTED_STATUS;
    } else if (allSubscribersAborted(uniqueSubscribersStages)) {
        return constants.REPORT_ABORTED_STATUS;
    } else if (allSubscribersFailed(uniqueSubscribersStages)) {
        return constants.REPORT_FAILED_STATUS;
    } else {
        return calculateDynamicReportStatus(report, uniqueSubscribersStages);
    }
}

function calculateDynamicReportStatus(report, uniqueSubscribersStages) {
    if (uniqueSubscribersStages.includes(constants.SUBSCRIBER_DONE_STAGE)) {
        return constants.REPORT_PARTIALLY_FINISHED_STATUS;
    } else if (uniqueSubscribersStages.includes(constants.SUBSCRIBER_INTERMEDIATE_STAGE)) {
        return constants.REPORT_IN_PROGRESS_STATUS;
    } else if (uniqueSubscribersStages.includes(constants.SUBSCRIBER_STARTED_STAGE)) {
        return constants.REPORT_STARTED_STATUS;
    } else if (uniqueSubscribersStages.includes(constants.SUBSCRIBER_INITIALIZING_STAGE)) {
        return constants.REPORT_INITIALIZING_STATUS;
    } else {
        return constants.REPORT_FAILED_STATUS;
    }
}

function getListOfSubscribersStages (report) {
    const runnerStates = report.subscribers.map((subscriber) => subscriber.stage);
    return runnerStates;
}

function allSubscribersFinished (subscriberStages) {
    return subscriberStages.length === 1 && subscriberStages[0] === constants.SUBSCRIBER_DONE_STAGE;
}

function allSubscribersAborted (subscriberStages) {
    return subscriberStages.length === 1 && subscriberStages[0] === constants.SUBSCRIBER_ABORTED_STAGE;
}

function allSubscribersFailed (subscriberStages) {
    return subscriberStages.length === 1 && subscriberStages[0] === constants.SUBSCRIBER_FAILED_STAGE;
}

function allSubscribersInitializing (subscriberStages) {
    return subscriberStages.length === 1 && subscriberStages[0] === constants.SUBSCRIBER_INITIALIZING_STAGE;
}

function allSubscribersStarted (subscriberStages) {
    return subscriberStages.length === 1 && subscriberStages[0] === constants.SUBSCRIBER_STARTED_STAGE;
}
