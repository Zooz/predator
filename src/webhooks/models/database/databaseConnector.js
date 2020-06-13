let databaseConfig = require('../../../config/databaseConfig');
let cassandraConnector = require('./cassandra/cassandraConnector');
let sequelizeConnector = require('./sequelize/sequelizeConnector');
let databaseConnector = databaseConfig.type.toLowerCase() === 'cassandra' ? cassandraConnector : sequelizeConnector;
module.exports = {
    init,
    getAllWebhooks,
    closeConnection
};

async function init() {
    return databaseConnector.init();
}

function closeConnection() {
    return databaseConnector.closeConnection();
}

async function getAllWebhooks(from, limit, exclude) {
    return databaseConnector.getAllWebhooks(from, limit, exclude);
}