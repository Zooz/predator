const constConfig = require('../../common/consts').CONFIG;
const innerConfigConstants = require('../../common/consts').INNER_CONFIGS;

let configDataMap = {
    [constConfig.JOB_PLATFORM]: { value: process.env.JOB_PLATFORM, type: 'string' },
    [constConfig.INTERNAL_ADDRESS]: { value: process.env.INTERNAL_ADDRESS, type: 'string' },
    [constConfig.DOCKER_NAME]: { value: process.env.DOCKER_NAME || 'zooz/predator-runner:latest', type: 'string' },
    [constConfig.RUNNER_CPU]: { value: process.env.RUNNER_CPU || 1, type: 'int' },
    [constConfig.RUNNER_MEMORY]: { value: process.env.RUNNER_MEMORY || 2048, type: 'int' },
    [constConfig.MINIMUM_WAIT_FOR_DELAYED_REPORT_STATUS_UPDATE_IN_MS]: { value: process.env.MINIMUM_WAIT_FOR_DELAYED_REPORT_STATUS_UPDATE_IN_MS || 30000, type: 'int' },
    [constConfig.DEFAULT_EMAIL_ADDRESS]: { value: process.env.DEFAULT_EMAIL_ADDRESS, type: 'string' },
    [constConfig.DEFAULT_WEBHOOK_URL]: { value: process.env.DEFAULT_WEBHOOK_URL, type: 'string' },
    [constConfig.GRFANA_URL]: { value: process.env.GRAFANA_URL, type: 'string' },
    [constConfig.METRICS_PLUGIN_NAME]: { value: process.env.METRICS_PLUGIN_NAME, type: 'string' },
    [constConfig.PROMETHEUS_METRICS]: {
        value: {
            [innerConfigConstants.PROMETHEUS_PUSH_GATEWAY_URL]: { value: process.env.PROMETHEUS_PUSH_GATEWAY_URL, type: 'string' },
            [innerConfigConstants.PROMETHEUS_BUCKET_SIZES]: { value: process.env.PROMETHEUS_BUCKET_SIZES, type: 'string' }
        },
        type: 'json'
    },
    [constConfig.INFLUX_METRICS]: {
        value: {
            [innerConfigConstants.INFLUX_HOST]: { value: process.env.INFLUX_HOST, type: 'string' },
            [innerConfigConstants.INFLUX_USERNAME]: { value: process.env.INFLUX_USERNAME, type: 'string' },
            [innerConfigConstants.INFLUX_PASSWORD]: { value: process.env.INFLUX_PASSWORD, type: 'string' },
            [innerConfigConstants.INFLUX_DATABASE]: { value: process.env.INFLUX_DATABASE, type: 'string' }
        },
        type: 'json'
    },
    [constConfig.SMTP_SERVER]: {
        value: {
            [innerConfigConstants.SMTP_FROM]: { value: process.env.SMTP_FROM, type: 'string' },
            [innerConfigConstants.SMTP_HOST]: { value: process.env.SMTP_HOST, type: 'string' },
            [innerConfigConstants.SMTP_PORT]: { value: process.env.SMTP_PORT, type: 'int' },
            [innerConfigConstants.SMTP_USERNAME]: { value: process.env.SMTP_USERNAME, type: 'string' },
            [innerConfigConstants.SMTP_PASSWORD]: { value: process.env.SMTP_PASSWORD, type: 'string' },
            [innerConfigConstants.SMTP_TIMEOUT]: { value: process.env.SMTP_TIMEOUT, type: 'int' }
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