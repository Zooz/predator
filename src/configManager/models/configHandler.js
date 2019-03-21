const _ = require('lodash');

const dbConnector = require('./database/databaseConnector');
const configDataMap = require('../helpers/configDataMap');
const configTemplate = require('../../common/consts').CONFIG;

module.exports.getConfigDataMap = () => {
    return configDataMap.getConfigMap();
};

module.exports.getConfigValue = async (configPath) => {
    const dbConfigValue = await dbConnector.getConfigValue(configPath);
    if (dbConfigValue) {
        return dbConfigValue;
    } else {
        let defaultValue = configDataMap.getConstDefaultValue(configPath);
        if (defaultValue instanceof Object) {
            for (let key in defaultValue) {
                if (defaultValue[key].value) {
                    defaultValue[key] = defaultValue[key].value;
                }
            }
        }
        return defaultValue;
    }
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
            const nestedConfig = createNestedConfigObject(configTemplateKeys, value);
            if (!_.isEmpty(nestedConfig)) {
                config[configTemplateKeys] = nestedConfig;
            }
        } else {
            config[configTemplateKeys] = value;
        }
    });
    return config;
}

function createNestedConfigObject(key, innerConfigAsObject) {
    const template = require('../../common/consts')[`${key.toUpperCase()}`];
    if (!template) {
        return innerConfigAsObject;
    }
    let nestedConfig = {};
    Object.values(template).forEach(configTemplateKeys => {
        let value = innerConfigAsObject[configTemplateKeys];
        if (value) {
            value = innerConfigAsObject[configTemplateKeys].value || value;
            nestedConfig[configTemplateKeys] = value;
        }
    });
    return nestedConfig;
}