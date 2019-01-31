'use strict';

let databaseConfig = require('../config/databaseConfig');
let cassandraConnector = require('./cassandra/cassandraConnector');
let sequelizeConnector = require('./sequelize/sequelizeConnector');
let databaseConnector = databaseConfig.type.toLowerCase() === 'cassandra' ? cassandraConnector : sequelizeConnector;

module.exports = {
    init,
    ping,
    closeConnection,
    insertReport,
    insertStats,
    updateReport,
    getReport,
    getReports,
    getLastReports,
    getStats
};

function insertReport(testId, revisionId, reportId, jobId, testType, startTime, testName, testDescription, testConfiguration, emails, webhooks, notes) {
    return databaseConnector.insertReport(testId, revisionId, reportId, jobId, testType, startTime, testName, testDescription, testConfiguration, emails, webhooks, notes);
}

function insertStats(testId, reportId, statId, statsTime, phaseIndex, phaseStatus, data) {
    return databaseConnector.insertStats(testId, reportId, statId, statsTime, phaseIndex, phaseStatus, data);
}

function updateReport(testId, reportId, status, phaseIndex, lastStats, endTime) {
    return databaseConnector.updateReport(testId, reportId, status, phaseIndex, lastStats, endTime);
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

function init() {
    return databaseConnector.init();
}

async function ping() {
    return databaseConnector.ping();
}

function closeConnection() {
    return databaseConnector.closeConnection();
}