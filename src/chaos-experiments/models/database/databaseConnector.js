const sequelizeConnector = require('./sequelize/sequelizeConnector');
const databaseConnector = sequelizeConnector;
module.exports = {
    init,
    getAllChaosExperiments,
    insertChaosExperiment,
    getChaosExperimentById,
    getChaosExperimentsByIds,
    getChaosExperimentByName,
    getChaosExperimentsByIds,
    deleteChaosExperiment,
    insertChaosJobExperiment,
    getChaosJobExperimentById,
    getChaosJobExperimentByJobId,
    setChaosJobExperimentTriggered,
    updateChaosExperiment,
    closeConnection
};

async function init() {
    return databaseConnector.init();
}

function closeConnection() {
    return databaseConnector.closeConnection();
}

async function insertChaosExperiment(experimentId, experiment, contextId) {
    return databaseConnector.insertChaosExperiment(experimentId, experiment, contextId);
}

async function getAllChaosExperiments(from, limit, exclude, contextId) {
    return databaseConnector.getAllChaosExperiments(from, limit, exclude, contextId);
}

async function getChaosExperimentById(experimentId, contextId) {
    return databaseConnector.getChaosExperimentById(experimentId, contextId);
}

async function getChaosExperimentsByIds (experimentIds, exclude, contextId) {
    return databaseConnector.getChaosExperimentsByIds(experimentIds, exclude, contextId);
}

async function getChaosExperimentByName(name, contextId) {
    return databaseConnector.getChaosExperimentByName(name, contextId);
}

async function getChaosExperimentsByIds(experimentIds, contextId) {
    return databaseConnector.getChaosExperimentsByIds(experimentIds, contextId);
}

async function updateChaosExperiment(experimentId, updatedProcessor) {
    return databaseConnector.updateChaosExperiment(experimentId, updatedProcessor);
}

async function deleteChaosExperiment(experimentId) {
    return databaseConnector.deleteChaosExperiment(experimentId);
}

async function insertChaosJobExperiment(jobExperimentId, jobId, experimentId, startTime, endTime, contextId) {
    return databaseConnector.insertChaosJobExperiment(jobExperimentId, jobId, experimentId, startTime, endTime, contextId);
}

async function getChaosJobExperimentById(jobExperimentId, contextId) {
    return databaseConnector.getChaosJobExperimentById(jobExperimentId, contextId);
}

async function getChaosJobExperimentByJobId(jobId, contextId) {
    return databaseConnector.getChaosJobExperimentById(jobId, contextId);
}

async function setChaosJobExperimentTriggered(jobExperimentId, isTriggered, contextId) {
    return databaseConnector.setChaosJobExperimentTriggered(jobExperimentId, isTriggered, contextId);
}
