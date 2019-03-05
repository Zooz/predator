'use strict';

const should = require('should');
const rewire = require('rewire');
const configConstants = require('../../../../src/common/consts').CONFIG;

let manager;

const allConfigData = {
    grafana_url: { value: 'test', type: 'type_test' },
    external_address: { value: 'test', type: 'type_test' },
    internal_address: { value: 'test', type: 'type_test' },
    docker_name: { value: 'test', type: 'type_test' },
    job_platform: { value: 'test', type: 'type_test' },
    runner_memory: { value: 'test', type: 'type_test' },
    runner_cpu: { value: 'test', type: 'type_test' },
    metrics_plugin_name: { value: 'test', type: 'type_test' },
    default_email_address: { value: 'test', type: 'type_test' },
    default_webhook_url: { value: 'test', type: 'type_test' },
    metrics_export_conf: { value: 'test', type: 'type_test' },
    influx_metrics: { value: 'test', type: 'type_test' },
    prometheus_metrics: { value: 'test', type: 'type_test' },
    smtp_server: { value: 'test', type: 'type_test' }
};

describe('config data map helper  tests', function() {
    describe('Manager config', function () {
        manager = rewire('../../../../src/configManager/helpers/configDataMap');
    });

    describe('get all configs with value from env data', function () {
        it('get all value success', () => {
            manager.__set__('configDataMap', allConfigData);
            Object.values(configConstants).forEach(value => {
                let result = manager.getConstDefaultValue(value);
                should(result).eql('test');
            });
        });
    });

    describe('get all configs  type from env data', function () {
        it('get all types success', () => {
            manager.__set__('configDataMap', allConfigData);
            Object.values(configConstants).forEach(value => {
                let result = manager.getConstType(value);
                should(result).eql('type_test');
            });
        });
    });
});
