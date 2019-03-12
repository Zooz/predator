const constConfig = require('../../common/consts').CONFIG;

let configDataMap = {
    [constConfig.GRFANA_URL]: { value: process.env.GRAFANA_URL, type: 'string' },
    [constConfig.EXTERNAL_ADDRESS]: { value: process.env.EXTERNAL_ADDRESS || process.env.INTERNAL_ADDRESS, type: 'string' },
    [constConfig.INTERNAL_ADDRESS]: { value: process.env.INTERNAL_ADDRESS, type: 'string' },
    [constConfig.DOCKER_NAME]: { value: process.env.DOCKER_NAME || 'zooz/predator-runner:latest', type: 'string' },
    [constConfig.JOB_PLATFORM]: { value: process.env.JOB_PLATFORM, type: 'string' },
    [constConfig.RUNNER_CPU]: { value: process.env.RUNNER_CPU || 1, type: 'int' },
    [constConfig.RUNNER_MEMORY]: { value: process.env.RUNNER_MEMORY || 2048, type: 'int' },
    [constConfig.MINIMUM_WAIT_FOR_DELAYED_REPORT_STATUS_UPDATE_IN_MS]: { value: process.env.MINIMUM_WAIT_FOR_DELAYED_REPORT_STATUS_UPDATE_IN_MS || 30000, type: 'int' },
    [constConfig.METRICS_PLUGIN_NAME]: { value: process.env.METRICS_PLUGIN_NAME, type: 'string' },
    [constConfig.PROMETHEUS_METRICS]: { value: process.env.METRICS_EXPORT_CONFIG, type: 'json' },
    [constConfig.INFLUX_METRICS]: { value: process.env.METRICS_EXPORT_CONFIG, type: 'json' },
    [constConfig.SMTP_SERVER]: {
        value: {
            from: { value: process.env.SMTP_FROM, type: 'string' },
            host: { value: process.env.SMTP_HOST, type: 'string' },
            port: { value: process.env.SMTP_PORT, type: 'string' },
            username: { value: process.env.SMTP_USERNAME, type: 'string' },
            password: { value: process.env.SMTP_PASSWORD, type: 'string' },
            timeout: { value: process.env.SMTP_TIMEOUT, type: 'int' }
        },
        type: 'json'
    }
};

module.exports.getConstType = (configValue) => {
    return configDataMap[configValue] ? configDataMap[configValue].type : undefined;
};

module.exports.getConstDefaultValue = (configValue) => {
    return configDataMap[configValue] ? configDataMap[configValue].value : undefined;
};

module.exports.getConfigMap = () => {
    return configDataMap;
};