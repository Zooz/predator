'use strict';
const databaseConfig = require('../../../../config/databaseConfig');
const constants = require('../../../../../src/reports/utils/constants');

const logger = require('../../../../common/logger');
let client;

const INSERT_REPORT_SUMMARY = 'INSERT INTO reports_summary(test_id, revision_id, report_id, job_id, test_type, phase, start_time, test_name, test_description, test_configuration, notes, last_updated_at) values(?,?,?,?,?,?,?,?,?,?,?,?) IF NOT EXISTS';
const UPDATE_REPORT_SUMMARY = 'UPDATE reports_summary SET phase=?, last_updated_at=?, end_time=? WHERE test_id=? AND report_id=?';
const GET_REPORT_SUMMARY = 'SELECT * FROM reports_summary WHERE test_id=? AND report_id=?';
const GET_REPORTS_SUMMARIES = 'SELECT * FROM reports_summary WHERE test_id=?';
const GET_LAST_SUMMARIES = 'SELECT * FROM last_reports LIMIT ?';
const INSERT_REPORT_STATS = 'INSERT INTO reports_stats(runner_id, test_id, report_id, stats_id, stats_time, phase_index, phase_status, data) values(?,?,?,?,?,?,?,?)';
const GET_REPORT_STATS = 'SELECT * FROM reports_stats WHERE test_id=? AND report_id=?';
const SUBSCRIBE_RUNNER = 'INSERT INTO report_subscribers(test_id, report_id, runner_id, stage) values(?,?,?,?)';
const UPDATE_SUBSCRIBERS = 'UPDATE report_subscribers SET stage=? WHERE test_id=? AND report_id=? AND runner_id=?';
const GET_REPORT_SUBSCRIBERS = 'SELECT * FROM report_subscribers WHERE test_id=? AND report_id=?';

module.exports = {
    init,
    insertReport,
    updateReport,
    getReport,
    getReports,
    getLastReports,
    insertStats,
    getStats,
    subscribeRunner,
    updateSubscribers
};

let queryOptions = {
    consistency: databaseConfig.cassandraConsistency,
    prepare: true
};

async function init(cassandraClient) {
    client = cassandraClient;
}

function insertReport(testId, revisionId, reportId, jobId, testType, phase, startTime, testName, testDescription, testConfiguration, notes, lastUpdatedAt) {
    let params;
    const testNotes = notes || '';
    params = [testId, revisionId, reportId, jobId, testType, phase, startTime, testName, testDescription, testConfiguration, testNotes, lastUpdatedAt];
    return executeQuery(INSERT_REPORT_SUMMARY, params, queryOptions);
}

function updateReport(testId, reportId, phaseIndex, lastUpdatedAt, endTime) {
    let params;
    params = [phaseIndex, lastUpdatedAt, endTime, testId, reportId];
    return executeQuery(UPDATE_REPORT_SUMMARY, params, queryOptions);
}

function getReport(testId, reportId) {
    let params;
    params = [testId, reportId];
    return getReportsAndParse(GET_REPORT_SUMMARY, params, queryOptions);
}

function getReports(testId) {
    let params;
    params = [testId];
    return getReportsAndParse(GET_REPORTS_SUMMARIES, params, queryOptions);
}

function getLastReports(limit) {
    let params;
    params = [limit];
    return getReportsAndParse(GET_LAST_SUMMARIES, params, queryOptions);
}

function insertStats(runnerId, testId, reportId, statId, statsTime, phaseIndex, phaseStatus, data) {
    let params;
    params = [runnerId, testId, reportId, statId, statsTime, phaseIndex, phaseStatus, data];
    return executeQuery(INSERT_REPORT_STATS, params, queryOptions);
}

function getStats(testId, reportId) {
    let params;
    params = [testId, reportId];
    return executeQuery(GET_REPORT_STATS, params, queryOptions);
}

function subscribeRunner(testId, reportId, runnerId) {
    let params;
    params = [testId, reportId, runnerId, constants.SUBSCRIBER_INITIALIZING_STAGE];
    return executeQuery(SUBSCRIBE_RUNNER, params, queryOptions);
}

async function updateSubscribers(testId, reportId, runnerId, stage) {
    const report = await getReport(testId, reportId);
    if (report.length === 0) {
        let error = new Error('Report not found');
        error.statusCode = 404;
        throw error;
    }
    let params;
    params = [stage, testId, reportId, runnerId];
    return executeQuery(UPDATE_SUBSCRIBERS, params, queryOptions);
}

function getReportSubscribers(testId, reportId) {
    let params;
    params = [testId, reportId];
    return executeQuery(GET_REPORT_SUBSCRIBERS, params, queryOptions);
}

function executeQuery(query, params, queryOptions) {
    return client.execute(query, params, queryOptions).then((result) => {
        logger.trace('Query result', {
            query: query,
            params: params,
            rows_returned: result.rowLength
        });
        return Promise.resolve(result.rows ? result.rows : []);
    }).catch((exception) => {
        logger.error(`Cassandra query failed \n ${JSON.stringify({ query, params, queryOptions })}`, exception);
        return Promise.reject(new Error('Error occurred in communication with cassandra'));
    });
}

async function getReportsAndParse(query, params, queryOptions) {
    let subscribers, report;
    const reports = await executeQuery(query, params, queryOptions);

    for (let reportIndex = 0; reportIndex < reports.length; reportIndex++) {
        report = reports[reportIndex];
        subscribers = await getReportSubscribers(report.test_id, report.report_id);
        subscribers = subscribers.map((subscriber) => {
            return {
                'runner_id': subscriber.runner_id,
                'stage': subscriber.stage
            };
        });
        report.subscribers = subscribers;
    }

    return reports;
}
