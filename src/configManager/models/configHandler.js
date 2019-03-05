const dbConnector = require('./database/databaseConnector');
const configDataMap = require('../helpers/configDataMap');
const constConfig = require('../../common/consts').CONFIG;

module.exports.getConfigValue = async (configPath) => {
    const dbConfigValue = await dbConnector.getConfigValue(configPath);
    return dbConfigValue || configDataMap.getConstDefaultValue(configPath);
};

module.exports.getConfig = async () => {
    let configAsObject = await dbConnector.getConfigAsObject();
    return createConfigObject(configAsObject);
};

module.exports.updateConfig = async (config) => {
    let response = await dbConnector.updateConfig(config);
    return response;
};

function createConfigObject(configAsObject) {
    let config = {};
    Object.values(constConfig).forEach(constValue => {
        const value = configAsObject[constValue] || configDataMap.getConstDefaultValue(constValue);
        config[constValue] = value;
    });
    return config;
}
