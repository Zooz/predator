'use strict';

let databaseConfig = require('../../config/databaseConfig');
let cassandraConnector = require('./database/cassandra/cassandraConnector');
let sequelizeConnector = require('./database/sequelize/sequelizeConnector');
let databaseConnector = databaseConfig.type.toLowerCase() === 'cassandra' ? cassandraConnector : sequelizeConnector;

module.exports = {
    insertReport,
    insertStats,
    updateReport,
    updateReportNotes,
    getReport,
    getReports,
    getLastReports,
    getStats,
    subscribeRunner,
    updateSubscriberWithStats,
    updateSubscriber

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

function updateReportNotes(testId, reportId, notes, lastUpdatedAt) {
    return databaseConnector.updateReportNotes(testId, reportId, notes, lastUpdatedAt);
}

function getLastReports(limit) {
    return databaseConnector.getLastReports(limit);
}

function getReports(testId) {
    return databaseConnector.getReports(testId);
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
