'use strict';

const databaseConnector = require('./sequelize/sequelizeConnector');

module.exports = {
    init,
    closeConnection,
    insertJob,
    getJobs,
    getJob,
    deleteJob,
    updateJob
};

async function insertJob(jobId, jobInfo, contextId) {
    return databaseConnector.insertJob(jobId, jobInfo, contextId);
}

async function getJobs(contextId) {
    return databaseConnector.getJobs(contextId);
}

async function getJob(jobId, contextId) {
    return databaseConnector.getJob(jobId, contextId);
}

async function updateJob(jobId, jobInfo) {
    return databaseConnector.updateJob(jobId, jobInfo);
}

async function deleteJob(jobId, contextId) {
    return databaseConnector.deleteJob(jobId, contextId);
}

async function init() {
    return databaseConnector.init();
}

function closeConnection() {
    return databaseConnector.closeConnection();
}
