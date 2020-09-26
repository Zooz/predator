const dbConnector = require('./database/databaseConnector');
const configDataMap = require('../helpers/configDataMap');
const configTemplate = require('../../common/consts').CONFIG;
const convertData = require('../helpers/convertData');

module.exports.getConfigValue = async (configPath) => {
    const dbConfigValue = await dbConnector.getConfigValue(configPath);
    const value = dbConfigValue || configDataMap.getConstDefaultValue(configPath);
    const type = configDataMap.getConstType(configPath);
    const convertedValue = convertData.convertByType(value, type);
    return convertedValue;
};

module.exports.getConfig = async () => {
    const configAsObject = await dbConnector.getConfigAsObject();
    return createConfigObject(configAsObject);
};

module.exports.updateConfig = async (config) => {
    const response = await dbConnector.updateConfig(config);
    return response;
};

module.exports.deleteConfig = async (key) => {
    const response = await dbConnector.deleteConfig(key);
    return response;
};

function createConfigObject(configAsObject) {
    const config = {};
    Object.values(configTemplate).forEach(configTemplateKey => {
        const value = configAsObject[configTemplateKey] !== (undefined) ? configAsObject[configTemplateKey] : configDataMap.getConstDefaultValue(configTemplateKey);
        const type = configDataMap.getConstType(configTemplateKey);
        config[configTemplateKey] = convertData.convertByType(value, type);
    });
    return config;
}
