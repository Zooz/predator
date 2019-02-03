'use strict';
let databaseConfig = require('../../../../config/databaseConfig');

let logger = require('../../../../common/logger');
let client;

const INSERT_REPORT_SUMMARY = 'INSERT INTO reports_summary(test_id, revision_id, report_type, report_id, job_id, test_type, status, phase, start_time, test_name, test_description, test_configuration, emails, webhooks, notes) values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)';
const UPDATE_REPORT_SUMMARY = 'UPDATE reports_summary SET status=?, phase=?, last_stats=?, end_time=? WHERE test_id=? AND report_id=? AND report_type=?';
const GET_REPORT_SUMMARY = 'SELECT * FROM reports_summary WHERE test_id=? AND report_id=? AND report_type=?';
const GET_REPORTS_SUMMARIES = 'SELECT * FROM reports_summary WHERE test_id=? AND report_type=?';
const GET_LAST_SUMMARIES = 'SELECT * FROM last_reports LIMIT ?';
const INSERT_REPORT_STATS = 'INSERT INTO reports_stats(test_id, report_id, state_id, stats_time, phase_index, phase_status, data) values(?,?,?,?,?,?,?)';
const GET_REPORT_STATS = 'SELECT * FROM reports_stats WHERE test_id=? AND report_id=?';

module.exports = {
    init,
    insertReport,
    updateReport,
    getReport,
    getReports,
    getLastReports,
    insertStats,
    getStats
};

let queryOptions = {
    consistency: databaseConfig.cassandraConsistency,
    prepare: true
};

async function init(cassandraClient) {
    client = cassandraClient;
        logger.info('Reports cassandra client initialized');
}

function insertReport(testId, revisionId, reportId, jobId, testType, startTime, testName, testDescription, testConfiguration, emails, webhooks, notes) {
    let params;
    const testNotes = notes || '';
    params = [testId, revisionId, 'basic', reportId, jobId, testType, 'initialized', '0', startTime, testName, testDescription, testConfiguration, emails, webhooks, testNotes];
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
    return executeQuery(GET_REPORT_SUMMARY, params, queryOptions);
}

function getReports(testId) {
    let params;
    params = [testId, 'basic'];
    return executeQuery(GET_REPORTS_SUMMARIES, params, queryOptions);
}

function getLastReports(limit) {
    let params;
    params = [limit];
    return executeQuery(GET_LAST_SUMMARIES, params, queryOptions);
}

function insertStats(testId, reportId, statId, statsTime, phaseIndex, phaseStatus, data) {
    let params;
    params = [testId, reportId, statId, statsTime, phaseIndex, phaseStatus, data];
    return executeQuery(INSERT_REPORT_STATS, params, queryOptions);
}

function getStats(testId, reportId) {
    let params;
    params = [testId, reportId];
    return executeQuery(GET_REPORT_STATS, params, queryOptions);
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
        logger.error(`Cassandra query failed \n ${JSON.stringify({query, params, queryOptions})}`, exception);
        return Promise.reject(new Error('Error occurred in communication with cassandra'));
    });
}
