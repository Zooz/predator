'use strict';

let databaseConfig = require('../../config/databaseConfig');
let cassandraConnector = require('./database/cassandra/cassandraConnector');
let sequelizeConnector = require('./database/sequelize/sequelizeConnector');
let databaseConnector = databaseConfig.type.toLowerCase() === 'cassandra' ? cassandraConnector : sequelizeConnector;

module.exports = {
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