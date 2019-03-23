'use strict';

const databaseConfig = require('../../../config/databaseConfig');
const cassandraConnector = require('./cassandra/cassandraConnector');
const sequelizeConnector = require('./sequelize/sequelizeConnector');
const configDataMap = require('../../helpers/configDataMap');
const convertData = require('../../helpers/convertData');

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
        const type = configDataMap.getConstType(row.key);
        dbDataMap[row.key] = convertData.convertByType(row.value, type);
    });
    return dbDataMap;
}

async function getConfigValue(configValue) {
    const response = await databaseConnector.getConfigValue(configValue);
    const type = configDataMap.getConstType(configValue);
    const value = response[0] ? response[0].value : undefined;
    return convertData.convertByType(value, type);
}