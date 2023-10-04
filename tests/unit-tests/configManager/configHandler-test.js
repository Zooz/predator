'use strict';

process.env.JOB_PLATFORM = 'DOCKER';
const { version: originalPackageJsonVersion } = require('../../../package');
const packageJson = require('../../../package');
packageJson.version = '1.5.6';

const should = require('should');
const rewire = require('rewire');
const sinon = require('sinon');

const manager = rewire('../../../src/configManager/models/configHandler');
const databaseConnector = require('../../../src/configManager/models/database/databaseConnector');
const { CONFIG: configConstants, WARN_MESSAGES } = require('../../../src/common/consts');
const logger = require('../../../src/common/logger');

let warnLoggerStub;

const defaultSmtpServerConfig = {
    timeout: 200,
    rejectUnauthCerts: false,
    secure: false
};

describe('Manager config', function () {
    const expectedRunnerVersion = '1.5';

    const defaultConfig = {
        allow_insecure_tls: false,
        interval_cleanup_finished_containers_ms: 0,
        delay_runner_ms: 0,
        job_platform: 'DOCKER',
        runner_docker_image: 'zooz/predator-runner:' + expectedRunnerVersion,
        runner_cpu: 1,
        runner_memory: 256,
        smtp_server: Object.assign({}, defaultSmtpServerConfig),
        minimum_wait_for_delayed_report_status_update_in_ms: 30000,
        minimum_wait_for_chaos_experiment_deletion_in_ms: 720000,
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
        runner_docker_image: 'zooz/predator-runner:' + expectedRunnerVersion,
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
        runner_docker_image: 'zooz/predator-runner:' + expectedRunnerVersion,
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
        minimum_wait_for_chaos_experiment_deletion_in_ms: 720000,
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
        runner_docker_image: 'zooz/predator-runner:' + expectedRunnerVersion,
        grafana_url: 'test_grafana_url',
        runner_cpu: 2,
        runner_memory: 256,
        smtp_server: Object.assign({}, defaultSmtpServerConfig),
        minimum_wait_for_delayed_report_status_update_in_ms: 30000,
        minimum_wait_for_chaos_experiment_deletion_in_ms: 720000,
        benchmark_weights: {
            percentile_ninety_five: { percentage: 20 },
            percentile_fifty: { percentage: 20 },
            server_errors_ratio: { percentage: 20 },
            client_errors_ratio: { percentage: 20 },
            rps: { percentage: 20 }
        }
    };

    let sandbox;
    let databaseConnectorGetStub;
    let databaseConnectorGetValueStub;
    let databaseConnectorUpdateStub;

    before(() => {
        sandbox = sinon.sandbox.create();
        databaseConnectorGetStub = sandbox.stub(databaseConnector, 'getConfigAsObject');
        databaseConnectorGetValueStub = sandbox.stub(databaseConnector, 'getConfigValue');
        databaseConnectorUpdateStub = sandbox.stub(databaseConnector, 'updateConfig');
        warnLoggerStub = sandbox.stub(logger, 'warn');
    });

    beforeEach(() => {
        sandbox.resetHistory();
    });

    after(() => {
        sandbox.restore();
        packageJson.version = originalPackageJsonVersion;
    });

    describe('get default config', function () {
        it('get default config success', async () => {
            databaseConnectorGetStub.resolves([]);

            const result = await manager.getConfig();

            should(Object.keys(result).length).eql(Object.keys(configConstants).length);
            const resultEscapedUndefined = escapeUndefinedValues(result);
            should(resultEscapedUndefined).eql(defaultConfig);
        });
    });

    describe('get config from default and DB', function () {
        it('get config success', async () => {
            databaseConnectorGetStub.resolves({ runner_cpu: 2 });
            const result = await manager.getConfig();
            should(Object.keys(result).length).eql(Object.keys(configConstants).length);
            Object.keys(result).forEach(key => {
                if (key !== 'runner_cpu') {
                    should(result[key]).eql(defaultConfigNotEscaped[key]);
                }
            });
            should(result.runner_cpu).eql(2);
        });
    });

    describe('get config with corrupted data from DB', function () {
        it('get config success', async () => {
            databaseConnectorGetStub.resolves({ key_not_valid: 2 });
            const result = await manager.getConfig();
            const resultEscapedUndefined = escapeUndefinedValues(result);
            should(resultEscapedUndefined).eql(defaultConfig);
        });
    });

    describe('get config and parse types, types are valid', function () {
        it('get config success', async () => {
            databaseConnectorGetStub.resolves(configResponseParseObject);

            const result = await manager.getConfig();

            const resultEscapedUndefined = escapeUndefinedValues(result);
            should(resultEscapedUndefined).eql(configParseExpected);
        });
    });

    describe('get config value from env variables', function () {
        it('get config  value success', async () => {
            databaseConnectorGetValueStub.resolves(undefined);

            const result = await manager.getConfigValue('runner_cpu');
            should(result).eql(1);
        });
    });

    describe('update config ', function () {
        it('update config success', async () => {
            databaseConnectorUpdateStub.resolves([]);

            const result = await manager.updateConfig({ runner_cpu: 'test_runner_cpu' });
            should(result).eql([]);
        });
        it('update config with a bad runner image name, expect for a warning log', async function() {
            databaseConnectorUpdateStub.resolves([]);

            const result = await manager.updateConfig({ runner_docker_image: 'predator-runner:0.0.1' });
            should(result).eql([]);
            should(warnLoggerStub.calledOnce).equal(true);
            should(warnLoggerStub.args[0][0]).equal(WARN_MESSAGES.BAD_RUNNER_IMAGE);
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
