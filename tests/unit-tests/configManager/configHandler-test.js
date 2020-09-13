'use strict';

process.env.JOB_PLATFORM = 'DOCKER';

const should = require('should');
const rewire = require('rewire');
const sinon = require('sinon');

const databaseConnector = require('../../../src/configManager/models/database/databaseConnector');
const configConstants = require('../../../src/common/consts').CONFIG;

let manager;

const defaultSmtpServerConfig = {
    timeout: 200,
    rejectUnauthCerts: false,
    secure: false
};

const defaultConfig = {
    allow_insecure_tls: false,
    interval_cleanup_finished_containers_ms: 0,
    delay_runner_ms: 0,
    job_platform: 'DOCKER',
    runner_docker_image: 'zooz/predator-runner:latest',
    runner_cpu: 1,
    runner_memory: 256,
    smtp_server: Object.assign({}, defaultSmtpServerConfig),
    minimum_wait_for_delayed_report_status_update_in_ms: 30000,
    benchmark_weights: {
        percentile_ninety_five: { percentage: 20 },
        percentile_fifty: { percentage: 20 },
        server_errors_ratio: { percentage: 20 },
        client_errors_ratio: { percentage: 20 },
        rps: { percentage: 20 }
    }
};

const defaultConfigNotEscaped = {
    allow_insecure_tls: false,
    interval_cleanup_finished_containers_ms: 0,
    delay_runner_ms: 0,
    job_platform: 'DOCKER',
    runner_docker_image: 'zooz/predator-runner:latest',
    runner_cpu: 1,
    runner_memory: 256,
    smtp_server: Object.assign({}, defaultSmtpServerConfig),
    minimum_wait_for_delayed_report_status_update_in_ms: 30000,
    benchmark_weights: {
        percentile_ninety_five: { percentage: 20 },
        percentile_fifty: { percentage: 20 },
        server_errors_ratio: { percentage: 20 },
        client_errors_ratio: { percentage: 20 },
        rps: { percentage: 20 }
    }
};

const configResponseParseObject = {
    runner_cpu: 5,
    smtp_server: JSON.stringify({
        host: 'test',
        port: 'test',
        username: 'test',
        password: 'test',
        timeout: 'test'
    }),
    minimum_wait_for_delayed_report_status_update_in_ms: 30000
};

const configParseExpected = {
    allow_insecure_tls: false,
    interval_cleanup_finished_containers_ms: 0,
    delay_runner_ms: 0,
    job_platform: 'DOCKER',
    runner_docker_image: 'zooz/predator-runner:latest',
    runner_cpu: 5,
    runner_memory: 256,
    smtp_server: {
        host: 'test',
        port: 'test',
        username: 'test',
        password: 'test',
        timeout: 'test'
    },
    minimum_wait_for_delayed_report_status_update_in_ms: 30000,
    benchmark_weights: {
        percentile_ninety_five: { percentage: 20 },
        percentile_fifty: { percentage: 20 },
        server_errors_ratio: { percentage: 20 },
        client_errors_ratio: { percentage: 20 },
        rps: { percentage: 20 }
    }
};

const convertObjectDBData = {
    grafana_url: 'test_grafana_url',
    runner_cpu: 2,
    minimum_wait_for_delayed_report_status_update_in_ms: 30000
};
const resultAfterConvert = {
    allow_insecure_tls: false,
    interval_cleanup_finished_containers_ms: 0,
    delay_runner_ms: 0,
    job_platform: 'DOCKER',
    runner_docker_image: 'zooz/predator-runner:latest',
    grafana_url: 'test_grafana_url',
    runner_cpu: 2,
    runner_memory: 256,
    smtp_server: Object.assign({}, defaultSmtpServerConfig),
    minimum_wait_for_delayed_report_status_update_in_ms: 30000,
    benchmark_weights: {
        percentile_ninety_five: { percentage: 20 },
        percentile_fifty: { percentage: 20 },
        server_errors_ratio: { percentage: 20 },
        client_errors_ratio: { percentage: 20 },
        rps: { percentage: 20 }
    }
};

describe('Manager config', function () {
    let sandbox;
    let databaseConnectorGetStub;
    let databaseConnectorGetValueStub;
    let databaseConnectorUpdateStub;

    before(() => {
        sandbox = sinon.sandbox.create();
        databaseConnectorGetStub = sandbox.stub(databaseConnector, 'getConfigAsObject');
        databaseConnectorGetValueStub = sandbox.stub(databaseConnector, 'getConfigValue');
        databaseConnectorUpdateStub = sandbox.stub(databaseConnector, 'updateConfig');
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
            databaseConnectorGetStub.resolves([]);

            let result = await manager.getConfig();

            should(Object.keys(result).length).eql(Object.keys(configConstants).length);
            const resultEscapedUndefined = escapeUndefinedValues(result);
            should(resultEscapedUndefined).eql(defaultConfig);
        });
    });

    describe('get config from default and DB', function () {
        it('get config success', async () => {
            databaseConnectorGetStub.resolves({ 'runner_cpu': 2 });
            let result = await manager.getConfig();
            should(Object.keys(result).length).eql(Object.keys(configConstants).length);
            Object.keys(result).forEach(key => {
                if (key !== 'runner_cpu') {
                    should(result[key]).eql(defaultConfigNotEscaped[key]);
                }
            });
            should(result['runner_cpu']).eql(2);
        });
    });

    describe('get config with corrupted data from DB', function () {
        it('get config success', async () => {
            databaseConnectorGetStub.resolves({ 'key_not_valid': 2 });
            let result = await manager.getConfig();
            const resultEscapedUndefined = escapeUndefinedValues(result);
            should(resultEscapedUndefined).eql(defaultConfig);
        });
    });

    describe('get config and parse types, types are valid', function () {
        it('get config success', async () => {
            databaseConnectorGetStub.resolves(configResponseParseObject);

            let result = await manager.getConfig();

            const resultEscapedUndefined = escapeUndefinedValues(result);
            should(resultEscapedUndefined).eql(configParseExpected);
        });
    });

    describe('get config value from env variables', function () {
        it('get config  value success', async () => {
            databaseConnectorGetValueStub.resolves(undefined);

            let result = await manager.getConfigValue('runner_cpu');
            should(result).eql(1);
        });
    });

    describe('update config ', function () {
        it('update config success', async () => {
            databaseConnectorUpdateStub.resolves([]);

            let result = await manager.updateConfig({ runner_cpu: 'test_runner_cpu' });
            should(result).eql([]);
        });
    });

    describe('convert data to object from db data and default', function () {
        it('get config  values ', async () => {
            const createConfigObject = manager.__get__('createConfigObject');
            const result = createConfigObject(convertObjectDBData);
            const resultEscapedUndefined = escapeUndefinedValues(result);
            should(resultEscapedUndefined).eql(resultAfterConvert);
        });
    });

    function escapeUndefinedValues(object) {
        return JSON.parse(JSON.stringify(object));
    }
});
