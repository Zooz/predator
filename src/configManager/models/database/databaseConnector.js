'use strict';
const databaseConnector = require('./sequelize/sequelizeConnector');

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
    const dbDataMap = {};
    results.forEach(row => {
        dbDataMap[row.key] = row.value;
    });
    return dbDataMap;
}

async function getConfigValue(configValue) {
    const response = await databaseConnector.getConfigValue(configValue);
    return response[0] ? response[0].value : undefined;
}
