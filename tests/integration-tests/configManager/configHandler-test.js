'use strict';

const configRequestCreator = require('./helpers/requestCreator');
const should = require('should');
const validationError = 'Input validation error';
const configValues = require('../../../src/common/consts').CONFIG;

const defaultBody = {
    internal_address: 'http://localhost:80',
    docker_name: 'zooz/predator-runner:latest',
    job_platform: process.env.JOB_PLATFORM || 'DOCKER',
    runner_cpu: 1,
    runner_memory: 2048,
    minimum_wait_for_delayed_report_status_update_in_ms: 30000
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
        buckets_sizes: 'string_value'
    },
    smtp_server: {
        sender: 'test@mail.com',
        host: 'string_value',
        port: 2,
        username: 'string_value',
        password: 'string_value',
        timeout: 2
    },
    runner_memory: 2
};

const requestBody =
    {
        grafana_url: 'string_value_grafana_url',
        internal_address: 'string_value_internal_address',
        docker_name: 'string_value_docker_name',
        job_platform: 'string_value_job_platform',
        runner_cpu: 0,
        runner_memory: 0,
        metrics_plugin_name: 'prometheus',
        default_email_address: 'string_value_default_email_address',
        default_webhook_url: 'string_value_default_webhook_url',
        influx_metrics: {
            host: 'string_value_influx_metrics',
            username: 'string_value_username',
            password: 'string_value_password',
            database: 'string_value_database'
        },
        prometheus_metrics: {
            push_gateway_url: 'string_value_push_gateway_url',
            buckets_sizes: 'string_value_buckets_sizes'
        },
        smtp_server: {
            sender: 'test@mail.com',
            host: 'string_value_smtp_server',
            port: 2,
            username: 'string_value_username',
            password: 'string_value',
            timeout: 2
        },
        minimum_wait_for_delayed_report_status_update_in_ms: 30000
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
            let response = await configRequestCreator.getConfig();
            should(response.statusCode).eql(200);
            delete response.body['smtp_server'];
            should(response.body).eql(defaultBody);
        });
    });

    describe('delete config ', () => {
        it('delete config when value in db', async () => {
            await configRequestCreator.updateConfig({ grafana_url: 'delete_value' });
            const deleteResponse = await configRequestCreator.deleteConfig('grafana_url');
            const getResponse = await configRequestCreator.getConfig();
            should(deleteResponse.statusCode).eql(204);
            should(getResponse.body['grafana_url']).eql(undefined);
        });
        it('delete config when value not in db', async () => {
            const deleteResponse = await configRequestCreator.deleteConfig('not_real_key');
            should(deleteResponse.statusCode).eql(204);
        });
    });

    describe('Update config with special types ', () => {
        it('get all config with special types', async () => {
            let response = await configRequestCreator.updateConfig(updateBodyWithTypes);
            should(response.statusCode).eql(200);
            should(response.body['influx_metrics'] instanceof Object);
            should(response.body['prometheus_metrics'] instanceof Object);
            should(response.body['smtp_server'] instanceof Object);
            should(response.body['smtp_server'] instanceof Number);
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

    describe('Update config validation', () => {
        it('update config fail with validation require fields', async () => {
            let response = await configRequestCreator.updateConfig(requestBodyNotValidRequire);
            should(response.statusCode).eql(400);
            should(response.body.message).eql(validationError);
        });
    });
    describe('Update config validation', () => {
        it('update config fail with validation enum', async () => {
            let response = await configRequestCreator.updateConfig(requestBodyNotValidEnum);
            should(response.statusCode).eql(400);
            should(response.body.message).eql(validationError);
        });
    });
    describe('Update config validation', () => {
        it('update config fail with validation type', async () => {
            let response = await configRequestCreator.updateConfig(requestBodyNotValidType);
            should(response.statusCode).eql(400);
            should(response.body.message).eql(validationError);
        });
    });
});

async function cleanData() {
    const valuesToDelete = Object.values(configValues);
    for (let i = 0; i < valuesToDelete.length; i++) {
        await configRequestCreator.deleteConfig(valuesToDelete[i]);
    }
}
