'use strict';

const sequelizeConnector = require('./database/sequelize/sequelizeConnector');
const databaseConnector = sequelizeConnector;

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

function insertReport(reportId, testId, revisionId, jobId, testType, phase, startTime, testName, testDescription, testConfiguration, notes, lastUpdatedAt, isFavorite) {
    return databaseConnector.insertReport(reportId, testId, revisionId, jobId, testType, phase, startTime, testName, testDescription, testConfiguration, notes, lastUpdatedAt, isFavorite);
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

function getLastReports(limit, filter) {
    return databaseConnector.getLastReports(limit, filter);
}

function getReports(testId, filter) {
    return databaseConnector.getReports(testId, filter);
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
