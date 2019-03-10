'use strict';

const configRequestCreator = require('./helpers/requestCreator');
const should = require('should');
const validationError = 'Input validation error';
const defaultBody = {
    external_address: 'http://localhost:80',
    internal_address: 'http://localhost:80',
    docker_name: 'zooz/predator-runner:latest',
    job_platform: process.env.JOB_PLATFORM || 'DOCKER',
    runner_cpu: 1,
    runner_memory: 2048
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
        grafana_url: 'string_value',
        external_address: 'string_value',
        internal_address: 'string_value',
        docker_name: 'string_value',
        job_platform: 'string_value',
        runner_cpu: 0,
        runner_memory: 0,
        metrics_plugin_name: 'prometheus',
        default_email_address: 'string_value',
        default_webhook_url: 'string_value',
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
            host: 'string_value',
            port: 2,
            username: 'string_value',
            password: 'string_value',
            timeout: 2
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

before(async () => {
    await configRequestCreator.init();
});

describe('update and get config', () => {
    describe('get config ', () => {
        it('get default config', async () => {
            let response = await configRequestCreator.getConfig();
            should(response.statusCode).eql(200);
            delete response.body['smtp_server'];
            should(response.body).eql(defaultBody);
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
