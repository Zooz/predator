'use strict';

const databaseConfig = require('../../../config/databaseConfig');
const cassandraConnector = require('./cassandra/cassandraConnector');
const sequelizeConnector = require('./sequelize/sequelizeConnector');

const databaseConnector = databaseConfig.type.toLowerCase() === 'cassandra' ? cassandraConnector : sequelizeConnector;

module.exports = {
    init,
    updateConfig,
    getConfigAsObject,
    deleteConfig,
    getConfigValue
};

async function init() {
    return databaseConnector.init();
}

async function updateConfig(updateValues) {
    return databaseConnector.updateConfig(updateValues);
}

async function deleteConfig(key) {
    return databaseConnector.deleteConfig(key);
}

async function getConfigAsObject() {
    const results = await databaseConnector.getConfig();
    let dbDataMap = {};
    results.forEach(row => {
        dbDataMap[row.key] = row.value;
    });
    return dbDataMap;
}

async function getConfigValue(configValue) {
    const response = await databaseConnector.getConfigValue(configValue);
    const value = response[0] ? response[0].value : undefined;
    return value;
}
