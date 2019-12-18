let databaseConfig = require('../../../config/databaseConfig');
let cassandraConnector = require('./cassandra/cassandraConnector');
let sequelizeConnector = require('./sequelize/sequelizeConnector');
let databaseConnector = databaseConfig.type.toLowerCase() === 'cassandra' ? cassandraConnector : sequelizeConnector;
module.exports = {
    init,
    getAllProcessors,
    insertProcessor,
    getProcessor,
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

async function getAllProcessors(from, limit) {
    return databaseConnector.getAllProcessors(from, limit);
}

async function getProcessor(processorId) {
    return databaseConnector.getProcessor(processorId);
}

async function updateProcessor(processorId, updatedProcessor) {
    return databaseConnector.updateProcessor(processorId, updatedProcessor);
}

async function deleteProcessor(processorId) {
    return databaseConnector.deleteProcessor(processorId);
}
