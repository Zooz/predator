let databaseConfig = require('../../../config/databaseConfig');
let cassandraConnector = require('./cassandra/cassandraConnector');
let sequelizeConnector = require('./sequelize/sequelizeConnector');
let databaseConnector = databaseConfig.type.toLowerCase() === 'cassandra' ? cassandraConnector : sequelizeConnector;
module.exports = {
    init,
    getAllProcessors,
    insertProcessor,
    closeConnection,
    deleteProcessor
};
async function insertProcessor(jobId, jobInfo) {
    return databaseConnector.insertProcessor(jobId, jobInfo);
}
async function init() {
    return databaseConnector.init();
}

function closeConnection() {
    return databaseConnector.closeConnection();
}

async function getAllProcessors(from, limit) {
    return databaseConnector.getAllProcessors(from, limit);
}

async function deleteProcessor(processorId) {
    return databaseConnector.deleteProcessor(processorId);
}
