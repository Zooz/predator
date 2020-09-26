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

async function insertProcessor(processorId, processorInfo) {
    return databaseConnector.insertProcessor(processorId, processorInfo);
}

async function getAllProcessors(from, limit, exclude) {
    return databaseConnector.getAllProcessors(from, limit, exclude);
}

async function getProcessorById(processorId) {
    return databaseConnector.getProcessorById(processorId);
}

async function getProcessorByName(name) {
    return databaseConnector.getProcessorByName(name);
}

async function updateProcessor(processorId, updatedProcessor) {
    return databaseConnector.updateProcessor(processorId, updatedProcessor);
}

async function deleteProcessor(processorId) {
    return databaseConnector.deleteProcessor(processorId);
}
