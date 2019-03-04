const dbConnector = require('./database/databaseConnector');
const constConfig = require('../../common/consts').CONFIG;
const logger = require('../../common/logger');

const configDataMap = {
    [constConfig.GRFANA_URL]: { value: process.env.GRAFANA_URL },
    [constConfig.EXTERNAL_ADDRESS]: { value: process.env.EXTERNAL_ADDRESS, default: process.env.INTERNAL_ADDRESS },
    [constConfig.INTERNAL_ADDRESS]: { value: process.env.INTERNAL_ADDRESS },
    [constConfig.DOCKER_NAME]: { value: process.env.DOCKER_NAME, default: 'zooz/predator-runner:latest' },
    [constConfig.JOB_PLATFORM]: { value: process.env.JOB_PLATFORM },
    [constConfig.RUNNER_CPU]: { value: process.env.RUNNER_CPU, default: 1, type: 'int' },
    [constConfig.RUNNER_MEMORY]: { value: process.env.RUNNER_MEMORY, default: 2048, type: 'int' },
    [constConfig.METRICS_PLUGIN_NAME]: { value: process.env.METRICS_PLUGIN_NAME, type: 'json' },
    [constConfig.METRICS_EXPORT_CONF]: { value: process.env.METRICS_EXPORT_CONFIG, type: 'json' },
    [constConfig.SMTP_SERVER]: {
        value: JSON.stringify({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            username: process.env.SMTP_USERNAME,
            password: process.env.SMTP_PASSWORD,
            timeout: process.env.SMTP_TIMEOUT
        }),
        type: 'json'
    }
};

let getConfigValueFromEnv = function (configPath) {
    if (configDataMap[configPath]) {
        return configDataMap[configPath].value || configDataMap[configPath].default;
    }
    return undefined;
};

module.exports.getConfigValue = async (configPath) => {
    let dbConfigValue = await dbConnector.getConfigValue(configPath);
    return dbConfigValue || getConfigValueFromEnv(configPath);
};

module.exports.getConfig = async () => {
    let config = await dbConnector.getConfig();
    return createConfigObject(config);
};

module.exports.updateConfig = async (config) => {
    let response = await dbConnector.updateConfig(config);
    return response;
};

function createConfigObject(dbData) {
    let config = {};
    let dbDataMap = {};
    if (dbData) {
        dbData.forEach(row => {
            dbDataMap[row.key] = row.value;
        });
    }
    Object.keys(constConfig).forEach(key => {
        let constValue = constConfig[key];
        let type = configDataMap[constValue] ? configDataMap[constValue].type : undefined;
        let configValue = dbDataMap[constValue] || getConfigValueFromEnv(constValue);
        config[constValue] = convertByType(configValue, type);
    });
    return config;
}

function convertByType(valueToConvert, type) {
    let value = valueToConvert;
    try {
        if (valueToConvert && type) {
            switch (type) {
            case 'json':
                value = JSON.parse(valueToConvert);
                break;
            case 'int':
                value = isNaN(valueToConvert) ? handleParseError(valueToConvert, type) : parseInt(valueToConvert);
                break;
            }
        }
    } catch (err) {
        value = handleParseError(valueToConvert, type);
    }
    return value;
}

function handleParseError(value, type) {
    logger.error('Failed to convert value : ' + value + 'to type: ' + type);
    return 'Value is corrupted can cause to errors. value is: ' + value + ' expected to be of type: ' + type;
}