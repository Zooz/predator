'use strict';

let sequelizeConnector = require('./database/sequelize/sequelizeConnector');
let databaseConnector = sequelizeConnector;

module.exports = {
    insertReport,
    insertStats,
    updateReport,
    deleteReport,
    getReport,
    getReports,
    getLastReports,
    getStats,
    subscribeRunner,
    updateSubscriberWithStats,
    updateSubscriber,
    updateReportBenchmark

};

function insertReport(testId, revisionId, reportId, jobId, testType, phase, startTime, testName, testDescription, testConfiguration, notes, lastUpdatedAt) {
    return databaseConnector.insertReport(testId, revisionId, reportId, jobId, testType, phase, startTime, testName, testDescription, testConfiguration, notes, lastUpdatedAt);
}

function insertStats(runnerId, testId, reportId, statId, statsTime, phaseIndex, phaseStatus, data) {
    return databaseConnector.insertStats(runnerId, testId, reportId, statId, statsTime, phaseIndex, phaseStatus, data);
}

function updateReport(testId, reportId, reportData) {
    return databaseConnector.updateReport(testId, reportId, reportData);
}

function deleteReport(testId, reportId) {
    return databaseConnector.deleteReport(testId, reportId);
}

function updateReportBenchmark(testId, reportId, score, benchmarkData) {
    return databaseConnector.updateReportBenchmark(testId, reportId, score, benchmarkData);
}

function getLastReports(limit, orderBy) {
    return databaseConnector.getLastReports(limit, orderBy);
}

function getReports(testId, orderBy) {
    return databaseConnector.getReports(testId, orderBy);
}

function getReport(testId, reportId) {
    return databaseConnector.getReport(testId, reportId);
}

function getStats(testId, reportId) {
    return databaseConnector.getStats(testId, reportId);
}

function subscribeRunner(testId, reportId, runnerId, phaseStatus) {
    return databaseConnector.subscribeRunner(testId, reportId, runnerId, phaseStatus);
}

function updateSubscriberWithStats(testId, reportId, runnerId, phaseStatus, lastStats) {
    return databaseConnector.updateSubscriberWithStats(testId, reportId, runnerId, phaseStatus, lastStats);
}

function updateSubscriber(testId, reportId, runnerId, phaseStatus) {
    return databaseConnector.updateSubscriber(testId, reportId, runnerId, phaseStatus);
}
