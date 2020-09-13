'use strict';

let databaseConnector = require('./sequelize/sequelizeConnector');

module.exports = {
    init,
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

function closeConnection() {
    return databaseConnector.closeConnection();
}
