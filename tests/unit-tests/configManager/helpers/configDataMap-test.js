'use strict';

const should = require('should');
const rewire = require('rewire');
const configConstants = require('../../../../src/common/consts').CONFIG;

const valuesToCheck = ['grafana_url', 'external_address', 'internal_address', 'docker_name', 'job_platform', 'runner_memory', 'runner_cpu', 'metrics_plugin_name'];

let manager;
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

function changeAllEnvData() {
    process.env.GRAFANA_URL = 'grafana_url_test';
    process.env.EXTERNAL_ADDRESS = 'external_address_test';
    process.env.INTERNAL_ADDRESS = 'internal_address_test';
    process.env.DOCKER_NAME = 'docker_name_test';
    process.env.JOB_PLATFORM = 'job_platform_test';
    process.env.RUNNER_CPU = 'runner_cpu_test';
    process.env.RUNNER_MEMORY = 'runner_memory_test';
    process.env.METRICS_PLUGIN_NAME = 'metrics_plugin_name_test';
}

describe('configManager data map helper  tests', function() {
    describe('get all configs with value from env data', function () {
        it('get all value success', () => {
            changeAllEnvData();
            manager = rewire('../../../../src/configManager/helpers/configDataMap');
            valuesToCheck.forEach(key => {
                let result = manager.getConstDefaultValue(key);
                const expectedValue = key + '_test';
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
