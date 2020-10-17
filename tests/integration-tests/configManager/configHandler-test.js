'use strict';

const configRequestCreator = require('./helpers/requestCreator');
const should = require('should');
const validationError = 'Input validation error';
const configValues = require('../../../src/common/consts').CONFIG;
const packageJson = require('../../../package');
const RUNNER_VERSION = packageJson.version.substring(0, packageJson.version.length - 2);
const defaultBody = {
    interval_cleanup_finished_containers_ms: 0,
    allow_insecure_tls: false,
    internal_address: 'http://localhost:80',
    runner_docker_image: `zooz/predator-runner:${RUNNER_VERSION}`,
    job_platform: process.env.JOB_PLATFORM || 'DOCKER',
    runner_cpu: 1,
    runner_memory: 256,
    delay_runner_ms: 0,
    minimum_wait_for_delayed_report_status_update_in_ms: 30000,
    benchmark_weights: {
        percentile_ninety_five: { percentage: 20 },
        percentile_fifty: { percentage: 20 },
        server_errors_ratio: { percentage: 20 },
        client_errors_ratio: { percentage: 20 },
        rps: { percentage: 20 }
    }

};
const updateBodyWithTypes = {
    influx_metrics: {
        host: 'string_value',
        username: 'string_value',
        password: 'string_value',
        database: 'string_value'
    },
    prometheus_metrics: {
        push_gateway_url: 'string_value',
        buckets_sizes: 'string_value',
        labels: { key1: 'value1', key2: 'value2' }
    },
    smtp_server: {
        from: 'test@mail.com',
        host: 'string_value',
        port: 2,
        username: 'string_value',
        password: 'string_value',
        timeout: 2
    },
    runner_memory: 256,
    benchmark_threshold: 20,
    benchmark_weights: {
        percentile_ninety_five: { percentage: 20 },
        percentile_fifty: { percentage: 30 },
        server_errors_ratio: { percentage: 20 },
        client_errors_ratio: { percentage: 20 },
        rps: { percentage: 10 }
    }
};

const requestBody = {
    interval_cleanup_finished_containers_ms: 0,
    allow_insecure_tls: false,
    grafana_url: 'string_value_grafana_url',
    internal_address: 'string_value_internal_address',
    runner_docker_image: 'string_value_docker_name',
    job_platform: 'string_value_job_platform',
    delay_runner_ms: 0,
    runner_cpu: 0,
    runner_memory: 256,
    metrics_plugin_name: 'prometheus',
    default_email_address: 'string_value_default_email_address',
    influx_metrics: {
        host: 'string_value_influx_metrics',
        username: 'string_value_username',
        password: 'string_value_password',
        database: 'string_value_database'
    },
    prometheus_metrics: {
        push_gateway_url: 'string_value_push_gateway_url',
        buckets_sizes: 'string_value_buckets_sizes',
        labels: { key1: 'value1', key2: 'value2' }
    },
    smtp_server: {
        from: 'test@mail.com',
        host: 'string_value_smtp_server',
        port: 2,
        username: 'string_value_username',
        password: 'string_value',
        timeout: 2
    },
    minimum_wait_for_delayed_report_status_update_in_ms: 30000,
    benchmark_threshold: 20,
    benchmark_weights: {
        percentile_ninety_five: { percentage: 20 },
        percentile_fifty: { percentage: 30 },
        server_errors_ratio: { percentage: 20 },
        client_errors_ratio: { percentage: 20 },
        rps: { percentage: 10 }
    }
};
const requestBodyNotValidEnum = { metrics_plugin_name: 'not enum' };
const requestBodyNotValidType = { runner_cpu: 'not_int' };
const requestBodyNotValidRequire = {
    influx_metrics: {
        host: 'string_value',
        username: 'string_value'
    }
};

describe('update and get config', () => {
    before(async () => {
        await configRequestCreator.init();
    });

    after(async () => {
        await cleanData();
    });

    describe('get config ', () => {
        it('get default config', async () => {
            const response = await configRequestCreator.getConfig();
            should(response.statusCode).eql(200);
            delete response.body.smtp_server;
            should(response.body).eql(defaultBody);
        });
    });

    describe('delete config ', () => {
        it('delete config when value in db', async () => {
            await configRequestCreator.updateConfig({ grafana_url: 'delete_value' });
            const deleteResponse = await configRequestCreator.deleteConfig('grafana_url');
            const getResponse = await configRequestCreator.getConfig();
            should(deleteResponse.statusCode).eql(204);
            should(getResponse.body.grafana_url).eql(undefined);
        });
        it('delete config when value not in db', async () => {
            const deleteResponse = await configRequestCreator.deleteConfig('not_real_key');
            should(deleteResponse.statusCode).eql(204);
        });
    });

    describe('Update config with special types ', () => {
        it('get all config with special types', async () => {
            const response = await configRequestCreator.updateConfig(updateBodyWithTypes);
            should(response.statusCode).eql(200);
            should(response.body.influx_metrics instanceof Object);
            should(response.body.prometheus_metrics instanceof Object);
            should(response.body.smtp_server instanceof Object);
            should(response.body.smtp_server instanceof Number);
            should(response.body.benchmark_threshold instanceof Number);
            should(response.body.benchmark_weights instanceof Object);
        });
    });
    describe('Update config and get config ', () => {
        it('update config success and get all values', async () => {
            const responseUpdate = await configRequestCreator.updateConfig(requestBody);
            const getResponse = await configRequestCreator.getConfig();
            should(responseUpdate.statusCode).eql(200);
            should(responseUpdate.body).eql(requestBody);
            should(getResponse.statusCode).eql(200);
            should(getResponse.body).eql(requestBody);
        });
    });

    describe('Update config with large json for custom runner definition', () => {
        it('params below minimum', async () => {
            const response = await configRequestCreator.updateConfig({
                custom_runner_definition: {
                    spec: {
                        template: {
                            spec: {
                                containers: [{
                                    resources: {
                                        limits: {
                                            memory: '512Mi',
                                            cpu: '1'
                                        },
                                        requests: {
                                            memory: '192Mi',
                                            cpu: '1'
                                        }
                                    }
                                }],
                                nodeSelector: {
                                    lifecycle: 'C5nSpot'
                                },
                                tolerations: [
                                    {
                                        key: 'instances',
                                        operator: 'Equal',
                                        value: 'c5n',
                                        effect: 'NoSchedule'
                                    }
                                ]
                            }
                        }
                    }
                }
            });
            should(response.statusCode).eql(200);
        });
    });

    describe('Update config validation', () => {
        it('update config fail with validation require fields', async () => {
            const response = await configRequestCreator.updateConfig(requestBodyNotValidRequire);
            should(response.statusCode).eql(400);
            should(response.body.message).eql(validationError);
        });
    });
    describe('Update config validation', () => {
        it('update config fail with validation enum', async () => {
            const response = await configRequestCreator.updateConfig(requestBodyNotValidEnum);
            should(response.statusCode).eql(400);
            should(response.body.message).eql(validationError);
        });
    });
    describe('Update config validation', () => {
        it('update config fail with validation type', async () => {
            const response = await configRequestCreator.updateConfig(requestBodyNotValidType);
            should(response.statusCode).eql(400);
            should(response.body.message).eql(validationError);
        });
    });

    describe('Update config with values below minimum', () => {
        it('params below minimum', async () => {
            const response = await configRequestCreator.updateConfig({
                runner_memory: 100,
                runner_cpu: -1,
                minimum_wait_for_delayed_report_status_update_in_ms: -1,
                delay_runner_ms: -1
            });
            should(response.statusCode).eql(400);
            should(response.body.message).eql(validationError);
            should(response.body.validation_errors).eql([
                'body/runner_cpu should be >= 0',
                'body/runner_memory should be >= 128',
                'body/minimum_wait_for_delayed_report_status_update_in_ms should be >= 0',
                'body/delay_runner_ms should be >= 0'
            ]);
        });
    });

    describe('Update config with benchmark weights not sum up to 100%', () => {
        it('params below minimum', async () => {
            const response = await configRequestCreator.updateConfig({
                benchmark_threshold: 20,
                benchmark_weights: {
                    percentile_ninety_five: { percentage: 50 },
                    percentile_fifty: { percentage: 30 },
                    server_errors_ratio: { percentage: 20 },
                    client_errors_ratio: { percentage: 30 },
                    rps: { percentage: 30 }
                }
            });
            should(response.statusCode).eql(422);
            should(response.body.message).eql('Benchmark weights needs to sum up to 100%');
        });
    });

    describe('Update config benchmark weights with invalid properties', () => {
        it('update config fail with validation type', async () => {
            const response = await configRequestCreator.updateConfig({
                benchmark_threshold: 20,
                benchmark_weights: { tps: '10' }
            });
            should(response.statusCode).eql(400);
            should(response.body.message).eql(validationError);
            should(response.body.validation_errors).eql([
                "body/benchmark_weights should NOT have additional properties 'tps'",
                "body/benchmark_weights should have required property 'percentile_ninety_five'",
                "body/benchmark_weights should have required property 'percentile_fifty'",
                "body/benchmark_weights should have required property 'server_errors_ratio'",
                "body/benchmark_weights should have required property 'client_errors_ratio'",
                "body/benchmark_weights should have required property 'rps'"]);
        });
    });

    describe('Update prometheus configuration with labels which are not key value', () => {
        it('update config fail with validation type', async () => {
            const response = await configRequestCreator.updateConfig({
                prometheus_metrics: {
                    push_gateway_url: 'string_value',
                    buckets_sizes: 'string_value',
                    labels: { key1: { innerKey1: 'value1' }, key2: 'value2' }
                }
            });
            should(response.statusCode).eql(400);
            should(response.body.message).eql(validationError);
            should(response.body.validation_errors).eql([
                "body/prometheus_metrics.labels['key1'] should be string"]);
        });
    });
});

async function cleanData() {
    const valuesToDelete = Object.values(configValues);
    for (let i = 0; i < valuesToDelete.length; i++) {
        await configRequestCreator.deleteConfig(valuesToDelete[i]);
    }
}
