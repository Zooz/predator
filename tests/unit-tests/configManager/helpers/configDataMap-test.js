'use strict';

const should = require('should');
const rewire = require('rewire');
const configConstants = require('../../../../src/common/consts').CONFIG;

let manager;
// let configDataMap = {
//     [constConfig.GRFANA_URL]: { value: process.env.GRAFANA_URL },
//     [constConfig.EXTERNAL_ADDRESS]: { value: process.env.EXTERNAL_ADDRESS || process.env.INTERNAL_ADDRESS },
//     [constConfig.INTERNAL_ADDRESS]: { value: process.env.INTERNAL_ADDRESS },
//     [constConfig.DOCKER_NAME]: { value: process.env.DOCKER_NAME || 'zooz/predator-runner:latest' },
//     [constConfig.JOB_PLATFORM]: { value: process.env.JOB_PLATFORM },
//     [constConfig.RUNNER_CPU]: { value: process.env.RUNNER_CPU || 1, type: 'int' },
//     [constConfig.RUNNER_MEMORY]: { value: process.env.RUNNER_MEMORY || 2048, type: 'int' },
//     [constConfig.METRICS_PLUGIN_NAME]: { value: process.env.METRICS_PLUGIN_NAME, type: 'string' },
//     [constConfig.PROMETHEUS_METRICS]: { value: process.env.METRICS_EXPORT_CONFIG, type: 'json' },
//     [constConfig.INFLUX_METRICS]: { value: process.env.METRICS_EXPORT_CONFIG, type: 'json' },
//     [constConfig.SMTP_SERVER]: {
//         value: {
//             host: process.env.SMTP_HOST,
//             port: process.env.SMTP_PORT,
//             username: process.env.SMTP_USERNAME,
//             password: process.env.SMTP_PASSWORD,
//             timeout: process.env.SMTP_TIMEOUT || 200
//         },
//         type: 'json'
//     }
// };

const expectedTypes = {
    grafana_url: undefined,
    external_address: undefined,
    internal_address: undefined,
    docker_name: undefined,
    job_platform: undefined,
    runner_memory: 'int',
    runner_cpu: 'int',
    metrics_plugin_name: 'string',
    default_email_address: undefined,
    default_webhook_url: undefined,
    influx_metrics: 'json',
    prometheus_metrics: 'json',
    smtp_server: 'json'
};

describe('configManager data map helper  tests', function() {
    describe('Manager configManager', function () {
        manager = rewire('../../../../src/configManager/helpers/configDataMap');
    });

    describe('get all configs with value from env data', function () {
        it('get all value success', () => {
            manager.__set__('configDataMap', allConfigData);
            Object.values(configConstants).forEach(key => {
                let result = manager.getConstDefaultValue(key);
                const expectedValue = allConfigData[key].value;
                should(result).eql(expectedValue);
            });
        });
    });

    describe('get all configs  type from env data', function () {
        it('get all types success', () => {
            Object.values(configConstants).forEach(key => {
                let result = manager.getConstType(key);
                const expectedType = expectedTypes[key];
                should(result).eql(expectedType);
            });
        });
    });
});
