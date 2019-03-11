const dbConnector = require('./database/databaseConnector');
const configDataMap = require('../helpers/configDataMap');
const configTemplate = require('../../common/consts').CONFIG;

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

module.exports.deleteConfig = async (key) => {
    let response = await dbConnector.deleteConfig(key);
    return response;
};

function createConfigObject(configAsObject) {
    let config = {};
    Object.values(configTemplate).forEach(configTemplateKeys => {
        const value = configAsObject[configTemplateKeys] !== (undefined) ? configAsObject[configTemplateKeys] : configDataMap.getConstDefaultValue(configTemplateKeys);
        config[configTemplateKeys] = value;
    });
    return config;
}
