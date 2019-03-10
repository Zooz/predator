'use strict';

const should = require('should');
const rewire = require('rewire');
const configConstants = require('../../../../src/common/consts').CONFIG;

let manager;

const allConfigData = {
    grafana_url: { value: 'test_grafana_url' },
    external_address: { value: 'test_external_address' },
    internal_address: { value: 'test_internal_address', type: 'type_test' },
    docker_name: { value: 'test_docker_name', type: 'type_test' },
    job_platform: { value: 'test_job_platform', type: 'type_test' },
    runner_memory: { value: 'test_runner_memory', type: 'type_test' },
    runner_cpu: { value: 'test_runner_cpu', type: 'type_test' },
    metrics_plugin_name: { value: 'test_metrics_plugin_name', type: 'type_test' },
    default_email_address: { value: 'test_default_email_address', type: 'type_test' },
    default_webhook_url: { value: 'test_default_webhook_url', type: 'type_test' },
    metrics_export_conf: { value: 'test_metrics_export_conf', type: 'string' },
    influx_metrics: { value: 'test_influx_metrics', type: 'number' },
    prometheus_metrics: { value: 'test_prometheus_metrics', type: 'json' },
    smtp_server: { value: 'test_smtp_server', type: 'int' }
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
            manager.__set__('configDataMap', allConfigData);
            Object.values(configConstants).forEach(key => {
                let result = manager.getConstType(key);
                const expectedType = allConfigData[key].type;
                should(result).eql(expectedType);
            });
        });
    });
});
