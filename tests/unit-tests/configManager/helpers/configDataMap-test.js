'use strict';

const should = require('should');
const rewire = require('rewire');
const configConstants = require('../../../../src/common/consts').CONFIG;

const valuesToCheck = ['grafana_url', 'internal_address', 'runner_docker_image', 'job_platform', 'runner_memory', 'runner_cpu', 'metrics_plugin_name', 'minimum_wait_for_delayed_report_status_update_in_ms'];

let manager;
const expectedTypes = {
    grafana_url: undefined,
    internal_address: undefined,
    runner_docker_image: undefined,
    job_platform: undefined,
    runner_memory: 'int',
    runner_cpu: 'float',
    allow_insecure_tls: 'boolean',
    interval_cleanup_finished_containers_ms: 'int',
    minimum_wait_for_delayed_report_status_update_in_ms: 'int',
    metrics_plugin_name: 'string',
    default_email_address: undefined,
    default_webhook_url: undefined,
    influx_metrics: 'json',
    prometheus_metrics: 'json',
    smtp_server: 'json',
    delay_runner_ms: 'int',
    benchmark_threshold: 'int',
    benchmark_threshold_webhook_url: 'string',
    benchmark_weights: 'json'
};

function changeAllEnvData() {
    process.env.GRAFANA_URL = 'grafana_url_test';
    process.env.INTERNAL_ADDRESS = 'internal_address_test';
    process.env.RUNNER_DOCKER_IMAGE = 'runner_docker_image_test';
    process.env.JOB_PLATFORM = 'job_platform_test';
    process.env.RUNNER_CPU = 'runner_cpu_test';
    process.env.RUNNER_MEMORY = 'runner_memory_test';
    process.env.ALLOW_INSECURE_TLS = 'allow_insecure_tls';
    process.env.INTERVAL_CLEANUP_FINISHED_CONTAINERS_MS = 'interval_cleanup_finished_containers_ms';
    process.env.METRICS_PLUGIN_NAME = 'metrics_plugin_name_test';
    process.env.MINIMUM_WAIT_FOR_DELAYED_REPORT_STATUS_UPDATE_IN_MS = 'minimum_wait_for_delayed_report_status_update_in_ms_test';
}

describe('configManager data map helper tests', function() {
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

    describe('get all configs type from env data', function () {
        it('get all types success', () => {
            Object.values(configConstants).forEach(key => {
                let result = manager.getConstType(key);
                const expectedType = expectedTypes[key];
                should(result).eql(expectedType);
            });
        });
    });
});
