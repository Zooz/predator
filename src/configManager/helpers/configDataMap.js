const constConfig = require('../../common/consts').CONFIG;

let configDataMap = {
    [constConfig.GRFANA_URL]: { value: process.env.GRAFANA_URL, type: 'string' },
    [constConfig.INTERNAL_ADDRESS]: { value: process.env.INTERNAL_ADDRESS, type: 'string' },
    [constConfig.DOCKER_NAME]: { value: process.env.DOCKER_NAME || 'zooz/predator-runner:latest', type: 'string' },
    [constConfig.JOB_PLATFORM]: { value: process.env.JOB_PLATFORM, type: 'string' },
    [constConfig.RUNNER_CPU]: { value: process.env.RUNNER_CPU || 1, type: 'int' },
    [constConfig.RUNNER_MEMORY]: { value: process.env.RUNNER_MEMORY || 2048, type: 'int' },
    [constConfig.MINIMUM_WAIT_FOR_DELAYED_REPORT_STATUS_UPDATE_IN_MS]: { value: process.env.MINIMUM_WAIT_FOR_DELAYED_REPORT_STATUS_UPDATE_IN_MS || 30000, type: 'int' },
    [constConfig.METRICS_PLUGIN_NAME]: { value: process.env.METRICS_PLUGIN_NAME, type: 'string' },
    [constConfig.PROMETHEUS_METRICS]: {
        value: {
            prometheus_push_gateway_url: { value: process.env.PROMETHEUS_PUSH_GATEWAY_URL, type: 'string' },
            prometheus_bucket_sizes: { value: process.env.PROMETHEUS_BUCKET_SIZES, type: 'string' }
        },
        type: 'json'
    },
    [constConfig.INFLUX_METRICS]: {
        value: {
            influx_host: { value: process.env.INFLUX_HOST, type: 'string' },
            influx_username: { value: process.env.INFLUX_USERNAME, type: 'string' },
            influx_password: { value: process.env.INFLUX_PASSWORD, type: 'string' },
            influx_database: { value: process.env.INFLUX_DATABASE, type: 'string' }
        },
        type: 'json'
    },
    [constConfig.SMTP_SERVER]: {
        value: {
            smtp_from: { value: process.env.SMTP_FROM, type: 'string' },
            smtp_host: { value: process.env.SMTP_HOST, type: 'string' },
            smtp_port: { value: process.env.SMTP_PORT, type: 'int' },
            smtp_username: { value: process.env.SMTP_USERNAME, type: 'string' },
            smtp_password: { value: process.env.SMTP_PASSWORD, type: 'string' },
            smtp_timeout: { value: process.env.SMTP_TIMEOUT, type: 'int' }
        },
        type: 'json'
    }
};

module.exports.getConstType = (configValue) => {
    return configDataMap[configValue] ? configDataMap[configValue].type : undefined;
};

module.exports.getConstDefaultValue = (configValue) => {
    if (configDataMap[configValue] && configDataMap[configValue].value instanceof Object) {
        let innerConfig = {};
        Object.keys(configDataMap[configValue].value).forEach((nestedConfigKey) => {
            innerConfig[nestedConfigKey] = configDataMap[configValue].value[nestedConfigKey].value;
        });
        return innerConfig;
    }
    return configDataMap[configValue] ? configDataMap[configValue].value : undefined;
};

module.exports.getConfigMap = () => {
    return configDataMap;
};