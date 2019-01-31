'use strict';

let databaseConfig = require('../../../config/databaseConfig');
let cassandraConnector = require('./cassandra/cassandraConnector');
let sequelizeConnector = require('./sequelize/sequelizeConnector');
let databaseConnector = databaseConfig.type.toLowerCase() === 'cassandra' ? cassandraConnector : sequelizeConnector;

module.exports = {
    init,
    ping,
    closeConnection,
    insertJob,
    getJobs,
    getJob,
    deleteJob,
    updateJob
};

async function insertJob(jobId, jobInfo) {
    return databaseConnector.insertJob(jobId, jobInfo);
}

async function getJobs() {
    return databaseConnector.getJobs();
}

async function getJob(jobId) {
    return databaseConnector.getJob(jobId);
}

async function updateJob(jobId, jobInfo) {
    return databaseConnector.updateJob(jobId, jobInfo);
}

async function deleteJob(jobId) {
    return databaseConnector.deleteJob(jobId);
}

async function init() {
    return databaseConnector.init();
}

async function ping() {
    return databaseConnector.ping();
}

function closeConnection() {
    return databaseConnector.closeConnection();
}