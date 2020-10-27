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

function insertReport(reportId, testId, revisionId, jobId, testType, phase, startTime, testName, testDescription, testConfiguration, notes, lastUpdatedAt, isFavorite, contextId) {
    return databaseConnector.insertReport(reportId, testId, revisionId, jobId, testType, phase, startTime, testName, testDescription, testConfiguration, notes, lastUpdatedAt, isFavorite, contextId);
}

function insertStats(runnerId, testId, reportId, statId, statsTime, phaseIndex, phaseStatus, data) {
    return databaseConnector.insertStats(runnerId, testId, reportId, statId, statsTime, phaseIndex, phaseStatus, data);
}

function updateReport(testId, reportId, reportData, contextId) {
    return databaseConnector.updateReport(testId, reportId, reportData, contextId);
}

function deleteReport(testId, reportId) {
    return databaseConnector.deleteReport(testId, reportId);
}

function updateReportBenchmark(testId, reportId, score, benchmarkData) {
    return databaseConnector.updateReportBenchmark(testId, reportId, score, benchmarkData);
}

function getLastReports(limit, filter, contextId) {
    return databaseConnector.getLastReports(limit, filter, contextId);
}

function getReports(testId, filter, contextId) {
    return databaseConnector.getReports(testId, filter, contextId);
}

function getReport(testId, reportId, contextId) {
    return databaseConnector.getReport(testId, reportId, contextId);
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
