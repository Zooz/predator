const sequelizeConnector = require('./sequelize/sequelizeConnector');
const databaseConnector = sequelizeConnector;
module.exports = {
    init,
    getAllProcessors,
    insertProcessor,
    getProcessorById,
    getProcessorByName,
    deleteProcessor,
    updateProcessor,
    closeConnection
};

async function init() {
    return databaseConnector.init();
}

function closeConnection() {
    return databaseConnector.closeConnection();
}

async function insertProcessor(processorId, processorInfo, contextId) {
    return databaseConnector.insertProcessor(processorId, processorInfo, contextId);
}

async function getAllProcessors(from, limit, exclude, contextId) {
    return databaseConnector.getAllProcessors(from, limit, exclude, contextId);
}

async function getProcessorById(processorId, contextId) {
    return databaseConnector.getProcessorById(processorId, contextId);
}

async function getProcessorByName(name, contextId) {
    return databaseConnector.getProcessorByName(name, contextId);
}

async function updateProcessor(processorId, updatedProcessor) {
    return databaseConnector.updateProcessor(processorId, updatedProcessor);
}

async function deleteProcessor(processorId) {
    return databaseConnector.deleteProcessor(processorId);
}
