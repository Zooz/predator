'use strict';

const databaseConnector = require('./databaseConnector'),
    jobConnector = require('../../jobs/models/jobManager'),
    configHandler = require('../../configManager/models/configHandler'),
    statsConsumer = require('./statsConsumer');

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
        parallelism: job.parallelism,
        max_virtual_users: job.max_virtual_users,
        environment: job.environment
    };

    await databaseConnector.insertReport(testId, reportBody.revision_id, reportBody.report_id, reportBody.job_id,
        reportBody.test_type, startTime, reportBody.test_name,
        reportBody.test_description, JSON.stringify(testConfiguration), job.notes);
    return reportBody;
};

module.exports.postStats = async (testId, reportId, stats) => {
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
        environment: testConfiguration.environment
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