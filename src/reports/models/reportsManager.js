'use strict';

const _ = require('lodash');

const databaseConnector = require('./databaseConnector'),
    jobConnector = require('../../jobs/models/jobManager'),
    configHandler = require('../../configManager/models/configHandler'),
    { JOB_TYPE_FUNCTIONAL_TEST } = require('../../common/consts'),
    constants = require('../utils/constants');

const FINAL_REPORT_STATUSES = [constants.REPORT_FINISHED_STATUS, constants.REPORT_ABORTED_STATUS, constants.REPORT_FAILED_STATUS];

const FINAL_REPORT_STATUSES_WITH_END_TIME = [constants.REPORT_FINISHED_STATUS, constants.REPORT_PARTIALLY_FINISHED_STATUS,
    constants.REPORT_FAILED_STATUS, constants.REPORT_ABORTED_STATUS];

module.exports.getReport = async (testId, reportId) => {
    const reportSummary = await databaseConnector.getReport(testId, reportId);

    if (reportSummary.length !== 1) {
        const error = new Error('Report not found');
        error.statusCode = 404;
        throw error;
    }
    const config = await configHandler.getConfig();
    const report = await getReportResponse(reportSummary[0], config);
    return report;
};

module.exports.getReports = async (testId, filter) => {
    const reportSummaries = await databaseConnector.getReports(testId, filter);
    const config = await configHandler.getConfig();
    const reports = reportSummaries.map((summaryRow) => {
        return getReportResponse(summaryRow, config);
    });
    reports.sort((a, b) => b.start_time - a.start_time);
    return reports;
};

module.exports.getLastReports = async (limit, filter) => {
    const reportSummaries = await databaseConnector.getLastReports(limit, filter);
    const config = await configHandler.getConfig();
    const reports = reportSummaries.map((summaryRow) => {
        return getReportResponse(summaryRow, config);
    });
    return reports;
};

module.exports.editReport = async (testId, reportId, reportBody) => {
    // currently we support only edit for notes
    const { notes, is_favorite } = reportBody;
    await databaseConnector.updateReport(testId, reportId, { notes, is_favorite });
};

module.exports.deleteReport = async (testId, reportId) => {
    const reportSummary = await databaseConnector.getReport(testId, reportId);
    const config = await configHandler.getConfig();
    const report = await getReportResponse(reportSummary[0], config);

    if (!FINAL_REPORT_STATUSES_WITH_END_TIME.includes(report.status)) {
        const error = new Error(`Can't delete running test with status ${report.status}`);
        error.statusCode = 409;
        throw error;
    }

    await databaseConnector.deleteReport(testId, reportId);
};

module.exports.postReport = async (testId, reportBody) => {
    const startTime = new Date(Number(reportBody.start_time));
    const job = await jobConnector.getJob(reportBody.job_id);
    const phase = '0';

    const testConfiguration = {
        job_type: job.type,
        duration: job.duration,
        parallelism: job.parallelism || 1,
        max_virtual_users: job.max_virtual_users,
        environment: job.environment
    };

    if (job.type === JOB_TYPE_FUNCTIONAL_TEST) {
        testConfiguration.arrival_count = job.arrival_count;
    } else {
        testConfiguration.arrival_rate = job.arrival_rate;
        testConfiguration.ramp_to = job.ramp_to;
    }

    await databaseConnector.insertReport(testId, reportBody.revision_id, reportBody.report_id, reportBody.job_id,
        reportBody.test_type, phase, startTime, reportBody.test_name,
        reportBody.test_description, JSON.stringify(testConfiguration), job.notes, Date.now(), false);
    await databaseConnector.subscribeRunner(testId, reportBody.report_id, reportBody.runner_id, constants.SUBSCRIBER_INITIALIZING_STAGE);
    return reportBody;
};

function getReportResponse(summaryRow, config) {
    const lastUpdateTime = summaryRow.end_time || summaryRow.last_updated_at;

    const testConfiguration = summaryRow.test_configuration ? JSON.parse(summaryRow.test_configuration) : {};
    const reportDurationSeconds = (new Date(lastUpdateTime).getTime() - new Date(summaryRow.start_time).getTime()) / 1000;

    let rps = 0;
    let totalRequests = 0;
    let completedRequests = 0;
    let successRequests = 0;

    summaryRow.subscribers.forEach((subscriber) => {
        if (subscriber.last_stats && subscriber.last_stats.rps && subscriber.last_stats.codes) {
            completedRequests += subscriber.last_stats.requestsCompleted;
            rps += subscriber.last_stats.rps.mean;
            totalRequests += subscriber.last_stats.rps.total_count || 0;
            Object.keys(subscriber.last_stats.codes).forEach(key => {
                if (key[0] === '2') {
                    successRequests += subscriber.last_stats.codes[key];
                }
            });
        }
    });

    const successRate = successRequests / completedRequests * 100;

    const report = {
        test_id: summaryRow.test_id,
        test_name: summaryRow.test_name,
        revision_id: summaryRow.revision_id,
        report_id: summaryRow.report_id,
        job_id: summaryRow.job_id,
        job_type: testConfiguration.job_type,
        is_favorite: summaryRow.is_favorite,
        test_type: summaryRow.test_type,
        start_time: summaryRow.start_time,
        end_time: summaryRow.end_time || undefined,
        phase: summaryRow.phase,
        duration_seconds: reportDurationSeconds,
        arrival_count: testConfiguration.arrival_count,
        arrival_rate: testConfiguration.arrival_rate,
        duration: testConfiguration.duration,
        ramp_to: testConfiguration.ramp_to,
        parallelism: testConfiguration.parallelism,
        max_virtual_users: testConfiguration.max_virtual_users,
        last_updated_at: summaryRow.last_updated_at,
        notes: summaryRow.notes,
        environment: testConfiguration.environment,
        subscribers: summaryRow.subscribers,
        last_rps: rps,
        avg_rps: Number((totalRequests / reportDurationSeconds).toFixed(2)),
        last_success_rate: successRate,
        score: summaryRow.score ? summaryRow.score : undefined,
        benchmark_weights_data: summaryRow.benchmark_weights_data ? JSON.parse(summaryRow.benchmark_weights_data) : undefined
    };

    report.status = calculateReportStatus(report, config);

    if (FINAL_REPORT_STATUSES_WITH_END_TIME.includes(report.status)) {
        report.end_time = report.last_updated_at;
    }

    report.grafana_report = generateGrafanaUrl(report, config.grafana_url);

    return report;
}

function generateGrafanaUrl(report, grafanaUrl) {
    if (grafanaUrl) {
        const endTimeGrafanafaQuery = report.end_time ? `&to=${new Date(report.end_time).getTime()}` : '&to=now';
        const grafanaReportUrl = encodeURI(grafanaUrl + `&var-Name=${report.test_name}&var-TestRunId=${report.report_id}&from=${new Date(report.start_time).getTime()}${endTimeGrafanafaQuery}`);
        return grafanaReportUrl;
    }
}

function calculateReportStatus(report, config) {
    const subscribersStages = getListOfSubscribersStages(report);
    const uniqueSubscribersStages = _.uniq(subscribersStages);

    const delayedTimeInMs = Math.max(report.duration * 0.01, config.minimum_wait_for_delayed_report_status_update_in_ms);
    const reportDurationMs = report.duration * 1000;
    const reportStartTimeMs = new Date(report.start_time).getTime();

    const isFinishedStatus = isAllSubscribersFinishedStatus(uniqueSubscribersStages);
    if (isFinishedStatus) {
        return isFinishedStatus;
    } else if (Date.now() >= reportStartTimeMs + reportDurationMs + delayedTimeInMs) {
        if (uniqueSubscribersStages.includes(constants.SUBSCRIBER_DONE_STAGE)) {
            return constants.REPORT_PARTIALLY_FINISHED_STATUS;
        } else {
            return constants.REPORT_FAILED_STATUS;
        }
    } else if (uniqueSubscribersStages.length === 1) {
        return subscriberStageToReportStatusMap(uniqueSubscribersStages[0]);
    } else {
        return calculateDynamicReportStatus(report, uniqueSubscribersStages);
    }
}

function calculateDynamicReportStatus(report, uniqueSubscribersStages) {
    if (uniqueSubscribersStages.includes(constants.SUBSCRIBER_DONE_STAGE)) {
        return constants.REPORT_PARTIALLY_FINISHED_STATUS;
    } else if (uniqueSubscribersStages.includes(constants.SUBSCRIBER_INTERMEDIATE_STAGE) || uniqueSubscribersStages.includes(constants.SUBSCRIBER_FIRST_INTERMEDIATE_STAGE)) {
        return constants.REPORT_IN_PROGRESS_STATUS;
    } else if (uniqueSubscribersStages.includes(constants.SUBSCRIBER_STARTED_STAGE)) {
        return constants.REPORT_STARTED_STATUS;
    } else if (uniqueSubscribersStages.includes(constants.SUBSCRIBER_INITIALIZING_STAGE)) {
        return constants.REPORT_INITIALIZING_STATUS;
    } else {
        return constants.REPORT_FAILED_STATUS;
    }
}

function getListOfSubscribersStages(report) {
    const runnerStates = report.subscribers.map((subscriber) => subscriber.phase_status);
    return runnerStates;
}

function isAllSubscribersFinishedStatus(subscribersStages) {
    if (subscribersStages.length === 1) {
        const mappedStatus = subscriberStageToReportStatusMap(subscribersStages);
        if (FINAL_REPORT_STATUSES.includes(mappedStatus)) {
            return mappedStatus;
        }
    }
}

function subscriberStageToReportStatusMap(subscriberStage) {
    const map = {
        [constants.SUBSCRIBER_INITIALIZING_STAGE]: constants.REPORT_INITIALIZING_STATUS,
        [constants.SUBSCRIBER_STARTED_STAGE]: constants.REPORT_STARTED_STATUS,
        [constants.SUBSCRIBER_FIRST_INTERMEDIATE_STAGE]: constants.REPORT_IN_PROGRESS_STATUS,
        [constants.SUBSCRIBER_INTERMEDIATE_STAGE]: constants.REPORT_IN_PROGRESS_STATUS,
        [constants.SUBSCRIBER_DONE_STAGE]: constants.REPORT_FINISHED_STATUS,
        [constants.SUBSCRIBER_ABORTED_STAGE]: constants.REPORT_ABORTED_STATUS,
        [constants.SUBSCRIBER_FAILED_STAGE]: constants.REPORT_FAILED_STATUS
    };

    return map[subscriberStage];
}
