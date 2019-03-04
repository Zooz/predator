'use strict';

const databaseConfig = require('../../../config/databaseConfig');
const cassandraConnector = require('./cassandra/cassandraConnector');
const sequelizeConnector = require('./sequelize/sequelizeConnector');
const databaseConnector = databaseConfig.type.toLowerCase() === 'cassandra' ? cassandraConnector : sequelizeConnector;

module.exports = {
    init,
    updateConfig,
    getConfig,
    getConfigValue
};

async function init() {
    return databaseConnector.init();
}

async function updateConfig(updateValues) {
    return databaseConnector.updateConfig(updateValues);
}

async function getConfig() {
    return databaseConnector.getConfig();
}

async function getConfigValue(configValue) {
    return databaseConnector.getConfigValue(configValue);
}
