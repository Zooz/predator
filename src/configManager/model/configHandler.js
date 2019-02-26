let dbConnector = require('../database/cassandra/cassandraConnector');
let constConfig = require('../../common/consts').CONFIG;

let envValues = {
    [constConfig.GRFANA_URL.name]: { value: process.env.GRAFANA_URL },
    [constConfig.EXTERNAL_ADDRESS.name]: { value: process.env.EXTERNAL_ADDRESS, default: process.env.INTERNAL_ADDRESS },
    [constConfig.INTERNAL_ADDRESS.name]: { value: process.env.INTERNAL_ADDRESS },
    [constConfig.DOCKER_NAME.name]: { value: process.env.DOCKER_NAME, default: 'zooz/predator-runner:latest' },
    [constConfig.JOB_PLATFORM.name]: { value: process.env.JOB_PLATFORM },
    [constConfig.RUNNER_CPU.name]: { value: process.env.RUNNER_CPU, default: 1 },
    [constConfig.RUNNER_MEMORY.name]: { value: process.env.RUNNER_MEMORY, default: 2048 },
    [constConfig.METRICS_PLUGIN_NAME.name]: { value: process.env.METRICS_PLUGIN_NAME },
    [constConfig.METRICS_EXPORT_CONF.name]: { value: process.env.METRICS_EXPORT_CONFIG },
    [constConfig.SMTP_SERVER.name]: {
        value: JSON.stringify({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            username: process.env.SMTP_USERNAME,
            password: process.env.SMTP_PASSWORD,
            timeout: process.env.SMTP_TIMEOUT || 2000
        })
    }

};

let getConfigValueFromEnv = function (configPath) {
    if (envValues[configPath]) {
        return envValues[configPath].value || envValues[configPath].default;
    }
    return undefined;
};

module.exports.getConfigValue = async function (configPath) {
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
        let configValue = dbDataMap[constValue.name] || getConfigValueFromEnv(constValue.name);
        config[constValue.name] = convertByType(configValue, constValue.type);
    });
    return config;
}

function convertByType(valueToConvert, type) {
    if (valueToConvert && type) {
        switch (type) {
        case 'json':
            return JSON.parse(valueToConvert);
        case 'int':
            return parseInt(valueToConvert);
        }
    }
    return valueToConvert;
}