'use strict';
const databaseConfig = require('../../../../config/databaseConfig'),
    dateUtil = require('../../../utils/dateUtil'),
    _ = require('lodash'),
    constants = require('../../../utils/constants');
const logger = require('../../../../common/logger');
let client;
const isRowAppliedField = '[applied]';
const INSERT_REPORT_SUMMARY = 'INSERT INTO reports_summary(test_id, revision_id, report_id, job_id, test_type, phase, start_time, test_name, test_description, test_configuration, notes, last_updated_at) values(?,?,?,?,?,?,?,?,?,?,?,?) IF NOT EXISTS';
const INSERT_LAST_REPORT_SUMMARY = 'INSERT INTO last_reports(start_time_year,start_time_month,test_id, revision_id, report_id, job_id, test_type, phase, start_time, test_name, test_description, test_configuration, notes, last_updated_at) values(?,?,?,?,?,?,?,?,?,?,?,?,?,?) IF NOT EXISTS';
const UPDATE_REPORT_BENCHMARK = 'UPDATE reports_summary SET score=?, benchmark_weights_data=? WHERE test_id=? AND report_id=?';
const DELETE_REPORT_SUMMARY = 'DELETE from reports_summary WHERE test_id=? AND report_id=?';
const GET_REPORT_SUMMARY = 'SELECT * FROM reports_summary WHERE test_id=? AND report_id=?';
const GET_REPORTS_SUMMARIES = 'SELECT * FROM reports_summary WHERE test_id=?';
const GET_LAST_SUMMARIES = 'SELECT * FROM last_reports WHERE start_time_year=? AND start_time_month=? LIMIT ?';
const INSERT_REPORT_STATS = 'INSERT INTO reports_stats(runner_id, test_id, report_id, stats_id, stats_time, phase_index, phase_status, data) values(?,?,?,?,?,?,?,?)';
const GET_REPORT_STATS = 'SELECT * FROM reports_stats WHERE test_id=? AND report_id=?';
const SUBSCRIBE_RUNNER = 'INSERT INTO report_subscribers(test_id, report_id, runner_id, phase_status) values(?,?,?,?)';
const UPDATE_SUBSCRIBER_WITH_STATS = 'UPDATE report_subscribers SET phase_status=?, last_stats=? WHERE test_id=? AND report_id=? AND runner_id=?';
const UPDATE_SUBSCRIBER = 'UPDATE report_subscribers SET phase_status=? WHERE test_id=? AND report_id=? AND runner_id=?';
const GET_REPORT_SUBSCRIBERS = 'SELECT * FROM report_subscribers WHERE test_id=? AND report_id=?';

module.exports = {
    init,
    insertReport,
    updateReport,
    deleteReport,
    getReport,
    getReports,
    getLastReports,
    insertStats,
    getStats,
    subscribeRunner,
    updateSubscriberWithStats,
    updateSubscriber,
    updateReportBenchmark
};

let queryOptions = {
    consistency: databaseConfig.cassandraConsistency,
    prepare: true
};

async function init(cassandraClient) {
    client = cassandraClient;
}

async function insertReport(testId, revisionId, reportId, jobId, testType, phase, startTime, testName, testDescription, testConfiguration, notes, lastUpdatedAt) {
    let params;
    const testNotes = notes || '';
    params = [testId, revisionId, reportId, jobId, testType, phase, startTime, testName, testDescription, testConfiguration, testNotes, lastUpdatedAt];
    const result = await executeQuery(INSERT_REPORT_SUMMARY, params, queryOptions);
    if (result[0][isRowAppliedField]) {
        insertLastReportAsync(testId, revisionId, reportId, jobId, testType, phase, startTime, testName, testDescription, testConfiguration, notes, lastUpdatedAt);
    }
    return result;
}

function insertLastReportAsync(testId, revisionId, reportId, jobId, testType, phase, startTime, testName, testDescription, testConfiguration, notes, lastUpdatedAt) {
    let params;
    const testNotes = notes || '';
    const startTimeDate = new Date(startTime);
    const startTimeYear = startTimeDate.getFullYear();
    const startTimeMonth = startTimeDate.getMonth() + 1;
    params = [startTimeYear, startTimeMonth, testId, revisionId, reportId, jobId, testType, phase, startTime, testName, testDescription, testConfiguration, testNotes, lastUpdatedAt];
    return executeQuery(INSERT_LAST_REPORT_SUMMARY, params, queryOptions)
        .catch(err => logger.error(`Cassandra insertLastReportAsync failed \n ${JSON.stringify({
            INSERT_LAST_REPORT_SUMMARY,
            params,
            queryOptions
        })}`, err));
}

async function updateReport(testId, reportId, reportData) {
    const UPDATE_REPORT_SUMMARY = 'UPDATE reports_summary';
    const where = 'WHERE test_id=? AND report_id=?';
    const queryData = buildUpdateQuery(UPDATE_REPORT_SUMMARY, reportData, where, [testId, reportId]);

    updateLastReportAsync(testId, reportId, reportData);
    return executeQuery(queryData.query, queryData.params, queryOptions);
}

async function deleteReport(testId, reportId) {
    const reportToDelete = await executeQuery(GET_REPORT_SUMMARY, [testId, reportId], queryOptions);

    const startTime = reportToDelete[0].start_time;
    const startTimeDate = new Date(startTime);
    const startTimeYear = startTimeDate.getFullYear();
    const startTimeMonth = startTimeDate.getMonth() + 1;
    const where = 'WHERE start_time_year=? AND start_time_month=? AND start_time=? AND test_id=? AND report_id=?';
    const whereParams = [startTimeYear, startTimeMonth, startTime, testId, reportId];
    const deleteLastReport = 'DELETE from last_reports';

    await executeQuery(`${deleteLastReport} ${where}`, whereParams, queryOptions);
    await executeQuery(DELETE_REPORT_SUMMARY, [testId, reportId], queryOptions);
}

function buildUpdateQuery(baseQuery, values, where, whereDataArray) {
    const entriesValues = Object.entries(values);
    const params = entriesValues.map((entry) => entry[1]).concat(whereDataArray);
    const setStatement = `SET ${entriesValues.map((entry) => `${entry[0]}=?`).join(', ')}`;
    const query = `${baseQuery} ${setStatement} ${where}`;

    return {
        query,
        params
    };
}

async function updateReportBenchmark(testId, reportId, score, benchmarkData) {
    const reportData = {
        score,
        benchmark_weights_data: benchmarkData
    };
    updateLastReportAsync(testId, reportId, reportData);
    const res = await executeQuery(UPDATE_REPORT_BENCHMARK, [score, benchmarkData, testId, reportId], { prepare: true });
    return res;
}

async function updateLastReportAsync(testId, reportId, reportData) {
    let queryData = {};
    try {
        const reportToUpdate = await executeQuery(GET_REPORT_SUMMARY, [testId, reportId], queryOptions);
        const startTime = reportToUpdate[0].start_time;
        const startTimeDate = new Date(startTime);
        const startTimeYear = startTimeDate.getFullYear();
        const startTimeMonth = startTimeDate.getMonth() + 1;

        const where = 'WHERE start_time_year=? AND start_time_month=? AND start_time=? AND test_id=? AND report_id=?';
        const whereParams = [startTimeYear, startTimeMonth, startTime, testId, reportId];
        const UPDATE_LAST_REPORT_SUMMARY = 'UPDATE last_reports';

        queryData = buildUpdateQuery(UPDATE_LAST_REPORT_SUMMARY, reportData, where, whereParams);

        await executeQuery(queryData.query, queryData.params, queryOptions);
    } catch (err) {
        logger.error(`Cassandra updateLastReportAsync failed \n ${JSON.stringify({
            query: queryData.query,
            params: queryData.params,
            queryOptions
        })}`, err);
    }
}

function getReport(testId, reportId) {
    let params;
    params = [testId, reportId];
    return getReportsWIthSubscribers(GET_REPORT_SUMMARY, params, queryOptions);
}

function getReports(testId) {
    let params;
    params = [testId];
    return getReportsWIthSubscribers(GET_REPORTS_SUMMARIES, params, queryOptions);
}

function getLastReports(limit) {
    return getLastReportsWIthSubscribers(limit);
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

function subscribeRunner(testId, reportId, runnerId, phaseStatus) {
    let params;
    params = [testId, reportId, runnerId, phaseStatus];
    return executeQuery(SUBSCRIBE_RUNNER, params, queryOptions);
}

async function updateSubscriberWithStats(testId, reportId, runnerId, phaseStatus, lastStats) {
    let params;
    params = [phaseStatus, lastStats, testId, reportId, runnerId];
    return executeQuery(UPDATE_SUBSCRIBER_WITH_STATS, params, queryOptions);
}

async function updateSubscriber(testId, reportId, runnerId, phaseStatus) {
    let params;
    params = [phaseStatus, testId, reportId, runnerId];
    return executeQuery(UPDATE_SUBSCRIBER, params, queryOptions);
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

async function getReportsWIthSubscribers(query, params, queryOptions) {
    const reports = await executeQuery(query, params, queryOptions);
    let reportsWithSubscribers = joinReportsWIthSubscribers(reports);
    return reportsWithSubscribers;
}

async function getLastReportsWIthSubscribers(limit) {
    let lastReportsPromise = [];
    for (let i = 0; i < constants.MAX_MONTH_OF_LAST_REPORTS; i++) {
        const date = dateUtil.dateXMonthAgo(i);
        lastReportsPromise.push(executeQuery(GET_LAST_SUMMARIES, [date.year, date.month, limit], queryOptions));
    }
    const reportsResult = await Promise.all(lastReportsPromise);
    const allReports = _(reportsResult).flatMap(value => value).value().slice(0, limit);
    let reportsWIthSubscribers = joinReportsWIthSubscribers(allReports);
    return reportsWIthSubscribers;
}

async function joinReportsWIthSubscribers(reports) {
    let subscribers, report;
    for (let reportIndex = 0; reportIndex < reports.length; reportIndex++) {
        report = reports[reportIndex];
        subscribers = await getReportSubscribers(report.test_id, report.report_id);
        subscribers = subscribers.map((subscriber) => {
            return {
                runner_id: subscriber.runner_id,
                phase_status: subscriber.phase_status,
                last_stats: JSON.parse(subscriber.last_stats)
            };
        });
        report.subscribers = subscribers;
    }
    return reports;
}
