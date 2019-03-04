'use strict';

process.env.JOB_PLATFORM = 'DOCKER';

const should = require('should');
const rewire = require('rewire');
const sinon = require('sinon');
const databaseConnector = require('../../../src/configManager/models/database/databaseConnector');
const configConstants = require('../../../src/common/consts').CONFIG;

let manager;

const defaultConfig = {
    job_platform: 'DOCKER',
    docker_name: 'zooz/predator-runner:latest',
    runner_cpu: 1,
    runner_memory: 2048,
    smtp_server: {}
};

const configResponseParseObject = [
    { key: 'runner_cpu', value: '5' },
    {
        key: 'smtp_server',
        value: JSON.stringify({
            host: 'test',
            port: 'test',
            username: 'test',
            password: 'test',
            timeout: 'test'
        })
    }
];

const configParseExpected = {
    job_platform: 'DOCKER',
    docker_name: 'zooz/predator-runner:latest',
    runner_cpu: 5,
    runner_memory: 2048,
    smtp_server: {
        host: 'test',
        port: 'test',
        username: 'test',
        password: 'test',
        timeout: 'test'
    }
};

const allConfigData = {
    grafana_url: { value: 'test' },
    external_address: { value: 'test' },
    internal_address: { value: 'test' },
    docker_name: { value: 'test' },
    job_platform: { value: 'test' },
    runner_memory: { value: 'test' },
    runner_cpu: { value: 'test' },
    metrics_plugin_name: { value: 'test' },
    default_email_address: { value: 'test' },
    default_webhook_url: { value: 'test' },
    metrics_export_conf: { value: 'test' },
    influx_metrics: { value: 'test' },
    prometheus_metrics: { value: 'test' },
    smtp_server: { value: 'test' }
};

describe('Manager tests', function () {
    let sandbox;

    let cassandraGetStub;

    before(() => {
        sandbox = sinon.sandbox.create();
        cassandraGetStub = sandbox.stub(databaseConnector, 'getConfig');
        manager = rewire('../../../src/configManager/models/configHandler');
    });

    beforeEach(() => {
        sandbox.resetHistory();
    });

    after(() => {
        sandbox.restore();
    });

    describe('get default config', function () {
        it('get default config success', async () => {
            cassandraGetStub.resolves([]);

            let result = await manager.getConfig();

            should(Object.keys(result).length).eql(Object.keys(configConstants).length);
            clearUndefinedValues(result);
            should(result).eql(defaultConfig);
        });
    });

    describe('get config from default and DB', function () {
        it('get config success', async () => {
            cassandraGetStub.resolves([{ key: 'runner_cpu', value: 2 }]);
            let result = await manager.getConfig();
            should(Object.keys(result).length).eql(Object.keys(configConstants).length);
            should(result['runner_cpu']).eql(2);
        });
    });

    describe('get config with corrupted data from DB', function () {
        it('get config success', async () => {
            cassandraGetStub.resolves([{ key: 'key_not_valid', value: 2 }]);
            let result = await manager.getConfig();
            clearUndefinedValues(result);
            should(result).eql(defaultConfig);
        });
    });

    describe('get config and parse types, types are valid', function () {
        it('get config success', async () => {
            cassandraGetStub.resolves(configResponseParseObject);

            let result = await manager.getConfig();

            clearUndefinedValues(result);
            should(result).eql(configParseExpected);
        });
    });

    describe('get config and parse types, types are not valid', function () {
        it('get config success with errors', async () => {
            let errorText = 'Value is corrupted can cause to errors';
            cassandraGetStub.resolves([{ key: 'runner_cpu', value: 'not int' }, {
                key: 'smtp_server',
                value: 'not json'
            }]);
            let result = await manager.getConfig();
            should(result['runner_cpu'].includes(errorText));
            should(result['smtp_server'].includes(errorText));
        });
    });

    describe('get all configs with value from env data', function () {
        it('get all config success', async () => {
            cassandraGetStub.resolves([]);
            manager.__set__('configDataMap', allConfigData);

            let results = await manager.getConfig();

            Object.values(configConstants).forEach(value => {
                should(results[value]).eql('test');
            });
        });
    });

    function clearUndefinedValues(object) {
        Object.keys(object).filter(key => !object[key]).forEach(key => {
            if (!object[key] && object[key] !== 0) {
                delete object[key];
            }
        });
    }
});
