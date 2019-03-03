'use strict';
let databaseConfig = require('../../../../config/databaseConfig');

let logger = require('../../../../common/logger');
let client;

const INSERT_REPORT_SUMMARY = 'INSERT INTO reports_summary(test_id, revision_id, report_type, report_id, job_id, test_type, status, phase, start_time, test_name, test_description, test_configuration, notes) values(?,?,?,?,?,?,?,?,?,?,?,?,?) IF NOT EXISTS';
const UPDATE_REPORT_SUMMARY = 'UPDATE reports_summary SET status=?, phase=?, last_stats=?, end_time=? WHERE test_id=? AND report_id=? AND report_type=?';
const GET_REPORT_SUMMARY = 'SELECT * FROM reports_summary WHERE test_id=? AND report_id=? AND report_type=?';
const GET_REPORTS_SUMMARIES = 'SELECT * FROM reports_summary WHERE test_id=? AND report_type=?';
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

function insertReport(testId, revisionId, reportId, jobId, testType, startTime, testName, testDescription, testConfiguration, notes) {
    let params;
    const testNotes = notes || '';
    params = [testId, revisionId, 'basic', reportId, jobId, testType, 'initialized', '0', startTime, testName, testDescription, testConfiguration, testNotes];
    return executeQuery(INSERT_REPORT_SUMMARY, params, queryOptions);
}

function updateReport(testId, reportId, status, phaseIndex, lastStats, endTime) {
    let params;
    params = [status, phaseIndex, lastStats, endTime, testId, reportId, 'basic'];
    return executeQuery(UPDATE_REPORT_SUMMARY, params, queryOptions);
}

function getReport(testId, reportId) {
    let params;
    params = [testId, reportId, 'basic'];
    return getReportsAndParse(GET_REPORT_SUMMARY, params, queryOptions);
}

function getReports(testId) {
    let params;
    params = [testId, 'basic'];
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
    params = [testId, reportId, runnerId, 'initializing'];
    return executeQuery(SUBSCRIBE_RUNNER, params, queryOptions);
}

function updateSubscribers(testId, reportId, runnerId, stage) {
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
