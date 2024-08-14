'use strict';

const uuid = require('uuid');

const databaseConnector = require('./databaseConnector'),
    jobConnector = require('../../jobs/models/jobManager'),
    configHandler = require('../../configManager/models/configHandler'),
    { JOB_TYPE_FUNCTIONAL_TEST, ERROR_MESSAGES } = require('../../common/consts'),
    constants = require('../utils/constants'),
    reportsStatusCalculator = require('./reportStatusCalculator'),
    generateError = require('../../common/generateError');
const chaosExperimentsManager = require('../../chaos-experiments/models/chaosExperimentsManager');
const logger = require('../../common/logger');
const { getContextId } = require('../../common/context/contextUtil');

const FINAL_REPORT_STATUSES_WITH_END_TIME = [constants.REPORT_FINISHED_STATUS, constants.REPORT_PARTIALLY_FINISHED_STATUS,
    constants.REPORT_FAILED_STATUS, constants.REPORT_ABORTED_STATUS];

module.exports.getReport = async (testId, reportId) => {
     const contextId = getContextId();
    const config = await configHandler.getConfig();
    const reports = await databaseConnector.getReport(testId, reportId, contextId);

    if (reports.length !== 1) {
        const error = new Error('Report not found');
        error.statusCode = 404;
        throw error;
    }
    const experiments = await enrichReportWithExperiments(reports[0], config);
    const report = getReportResponse(reports[0], config, experiments);
    return report;
};

module.exports.getReports = async (testId, filter) => {
     const contextId = getContextId();

    const reports = await databaseConnector.getReports(testId, filter, contextId);
    const config = await configHandler.getConfig();

    const mappedReports = await Promise.all(reports.map(async (report) => {
        const experiments = await enrichReportWithExperiments(report, config);
        return getReportResponse(report, config, experiments);
    }));

    return mappedReports;
};

module.exports.getLastReports = async (limit, filter) => {
     const contextId = getContextId();
    const reports = await databaseConnector.getLastReports(limit, filter, contextId);
    const config = await configHandler.getConfig();
    const mappedReports = await Promise.all(reports.map(async (report) => {
        const experiments = await enrichReportWithExperiments(report, config);
        return getReportResponse(report, config, experiments);
    }));
    return mappedReports;
};

module.exports.editReport = async (testId, reportId, reportBody) => {
    // currently we support only edit for notes
     const contextId = getContextId();

    const reportSummary = await databaseConnector.getReport(testId, reportId, contextId);
    if (!reportSummary) {
        throw generateError(404, ERROR_MESSAGES.NOT_FOUND);
    }

    const { notes, is_favorite } = reportBody;
    await databaseConnector.updateReport(testId, reportId, { notes, is_favorite }, contextId);
};

module.exports.deleteReport = async (testId, reportId) => {
     const contextId = getContextId();

    const reportSummary = await databaseConnector.getReport(testId, reportId, contextId);
    if (!reportSummary) {
        throw generateError(404, ERROR_MESSAGES.NOT_FOUND);
    }

    const config = await configHandler.getConfig();
    const report = getReportResponse(reportSummary[0], config);

    if (!FINAL_REPORT_STATUSES_WITH_END_TIME.includes(report.status)) {
        const error = new Error(`Can't delete running test with status ${report.status}`);
        error.statusCode = 409;
        throw error;
    }

    await databaseConnector.deleteReport(testId, reportId);
};

module.exports.postReport = async (reportId, test, job, startTime) => {
     const contextId = getContextId();

    const phase = '0';

    const testConfiguration = {
        job_type: job.type,
        duration: job.duration,
        parallelism: job.parallelism || 1,
        max_virtual_users: job.max_virtual_users,
        environment: job.environment,
        tag: job.tag
    };

    if (job.type === JOB_TYPE_FUNCTIONAL_TEST) {
        testConfiguration.arrival_count = job.arrival_count;
    } else {
        testConfiguration.arrival_rate = job.arrival_rate;
        testConfiguration.ramp_to = job.ramp_to;
    }

    const report = await databaseConnector.insertReport(reportId, test.id, test.revision_id, job.id,
        test.type, phase, startTime, test.name,
        test.description, JSON.stringify(testConfiguration), job.notes, Date.now(), false, contextId);
    return report.dataValues;
};

module.exports.subscribeRunnerToReport = async function (testId, reportId, runnerId) {
    return databaseConnector.subscribeRunner(testId, reportId, runnerId, constants.SUBSCRIBER_INITIALIZING_STAGE);
};

module.exports.postReportDeprecated = async function (testId, reportBody) {
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

    await databaseConnector.insertReport(reportBody.report_id, testId, reportBody.revision_id, reportBody.job_id,
        reportBody.test_type, phase, startTime, reportBody.test_name,
        reportBody.test_description, JSON.stringify(testConfiguration), job.notes, Date.now(), false);
    await databaseConnector.subscribeRunner(testId, reportBody.report_id, reportBody.runner_id, constants.SUBSCRIBER_INITIALIZING_STAGE);
    return reportBody;
};

module.exports.failReport = async function failReport(report) {
    return databaseConnector.subscribeRunner(report.test_id, report.report_id, uuid.v4(), constants.SUBSCRIBER_FAILED_STAGE);
};

async function enrichReportWithExperiments(report, config) {
    if (!config.chaos_mesh_enabled) return;
    try {
        const experiments = await getChaosExperimentsByJobId(report.job_id);
        return experiments;
    } catch (error) {
        logger.error(error, `Error occurred enrich report  ${report.id}, and job ${report.job_id} with attached chaos experiments`);
    }
}

function getReportResponse(summaryRow, config, experiments) {
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
        tag: testConfiguration.tag,
        last_updated_at: summaryRow.last_updated_at,
        notes: summaryRow.notes,
        environment: testConfiguration.environment,
        subscribers: summaryRow.subscribers,
        last_rps: rps,
        avg_rps: Number((totalRequests / reportDurationSeconds).toFixed(2)) || 0,
        last_success_rate: successRate,
        score: summaryRow.score ? summaryRow.score : undefined,
        benchmark_weights_data: summaryRow.benchmark_weights_data ? JSON.parse(summaryRow.benchmark_weights_data) : undefined,
        experiments: experiments && experiments.length ? experiments : undefined
    };

    report.status = reportsStatusCalculator.calculateReportStatus(report, config);

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

async function getChaosExperimentsByJobId(jobId) {
    const mappedChaosJobExperiments = [];
    const chaosJobExperiments = await chaosExperimentsManager.getChaosJobExperimentsByJobId(jobId);
    if (!chaosJobExperiments || chaosJobExperiments.length === 0) {
        return;
    }
    const uniqueExperimentIds = [...new Set(chaosJobExperiments.map(jobExperiment => jobExperiment.experiment_id))];
    const chaosExperiments = await chaosExperimentsManager.getChaosExperimentsByIds(uniqueExperimentIds);
    for (const chaosJobExperiment of chaosJobExperiments) {
        const chaosExperiment = chaosExperiments.find((experiment) => experiment.id === chaosJobExperiment.experiment_id && chaosJobExperiment.is_triggered);
        if (chaosExperiment) {
            mappedChaosJobExperiments.push({
                kind: chaosExperiment.kubeObject.kind,
                name: chaosExperiment.name,
                id: chaosExperiment.id,
                start_time: chaosJobExperiment.start_time,
                end_time: chaosJobExperiment.end_time
            });
        }
    }
    return mappedChaosJobExperiments;
}
