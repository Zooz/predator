const _ = require('lodash');

const dbConnector = require('./database/databaseConnector');
const configDataMap = require('../helpers/configDataMap');
const configTemplate = require('../../common/consts').CONFIG;

module.exports.getConfigDataMap = () => {
    return configDataMap.getConfigMap();
};

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
        if (value instanceof Object) {
            const nestedConfigAsObject = createNestedConfigObject(value);
            if (nestedConfigAsObject) {
                config[configTemplateKeys] = nestedConfigAsObject;
            }
        } else {
            config[configTemplateKeys] = value;
        }
    });
    return config;
}

function createNestedConfigObject(nestedConfigTemplate) {
    let nestedConfig = {};
    Object.keys(nestedConfigTemplate).forEach((templateKey) => {
        const value = nestedConfigTemplate[templateKey] instanceof Object
            ? nestedConfigTemplate[templateKey].value
            : nestedConfigTemplate[templateKey];
        if (value) {
            nestedConfig[templateKey] = value;
        }
    });
    if (_.isEmpty(nestedConfig)) {
        return undefined;
    } else {
        return nestedConfig;
    }
}