'use strict';

process.env.JOB_PLATFORM = 'DOCKER';

const should = require('should');
const sinon = require('sinon');
const rewire = require('rewire');
const databaseConnector = require('../../../src/configManager/models/database/databaseConnector');
const configConstants = require('../../../src/common/consts').CONFIG;

describe('Manager config with env variables', function () {
    let sandbox;
    let manager;
    let cassandraGetStub;

    before(() => {
        sandbox = sinon.sandbox.create();
        cassandraGetStub = sandbox.stub(databaseConnector, 'getConfigAsObject');

        process.env.SMTP_FROM = 'smtp_from_test';
        process.env.SMTP_PORT = 'smtp_port_test';
        process.env.SMTP_USERNAME = 'smtp_username_test';
        process.env.SMTP_PASSWORD = 'smtp_password_test';
        process.env.SMTP_TIMEOUT = '500';
        process.env.RUNNER_MEMORY = '20';
        process.env.RUNNER_CPU = '0.35';
        process.env.GRAFANA_URL = 'url_test';
        const configDataMap = rewire('../../../src/configManager/helpers/configDataMap');
        console.log('**********' + configDataMap.getConstDefaultValue('grafana_url'));
        manager = rewire('../../../src/configManager/models/configHandler');
        manager.__set__('configDataMap', configDataMap);
    });

    after(() => {
        delete process.env.SMTP_FROM;
        delete process.env.SMTP_PORT;
        delete process.env.SMTP_USERNAME;
        delete process.env.SMTP_PASSWORD;
        delete process.env.SMTP_TIMEOUT;
        delete process.env.RUNNER_MEMORY;
        delete process.env.RUNNER_CPU;
        delete process.env.GRAFANA_URL;
        sandbox.restore();
    });
    it('get config for from env varibles in the right types (json,int,float,string)', async () => {
        cassandraGetStub.resolves([]);
        let result = await manager.getConfig();
        should(Object.keys(result).length).eql(Object.keys(configConstants).length);
        should(result.grafana_url).eql('url_test');
        should(result.runner_memory).eql(20);
        should(result.runner_cpu).eql(0.35);
        should(result.smtp_server).eql({
            'from': 'smtp_from_test',
            'port': 'smtp_port_test',
            'username': 'smtp_username_test',
            'password': 'smtp_password_test',
            'timeout': '500'
        });
    });
});
