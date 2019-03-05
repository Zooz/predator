'use strict';
let sinon = require('sinon');
let driver = require('cassandra-driver');
let rewire = require('rewire');
let should = require('should');
let cassandraClient = rewire('../../../../src/configManager/models/database/cassandra/cassandraConnector');

describe('Cassandra client tests', function() {
    let sandbox;
    let clientBatchStub;
    let clientExecuteStub;
    let revert;

    before(() => {
        sandbox = sinon.sandbox.create();
        clientBatchStub = sandbox.stub(driver.Client.prototype, 'batch');
        clientExecuteStub = sandbox.stub(driver.Client.prototype, 'execute');
        revert = cassandraClient.__set__('client', { batch: clientBatchStub, execute: clientExecuteStub });
    });

    afterEach(() => {
        sandbox.resetHistory();
    });

    after(() => {
        sandbox.restore();
        revert();
    });

    describe('Upsert new config record', () => {
        it('should succeed simple update', async () => {
            clientBatchStub.resolves({ result: { rowLength: 0 } });
            let query = 'INSERT INTO config(key, value) values(?,?)';
            await cassandraClient.updateConfig({ key: 'test_key' });

            clientBatchStub.getCall(0).args[0][0].query.should.eql(query);
            clientBatchStub.getCall(0).args[0][0].params[0].should.eql('key');
            clientBatchStub.getCall(0).args[0][0].params[1].should.eql('test_key');
        });
    });

    describe('Upsert new config record object as value', () => {
        it('should succeed object value update', async () => {
            clientBatchStub.resolves({ result: { rowLength: 0 } });
            let query = 'INSERT INTO config(key, value) values(?,?)';
            let objectToSave = { test_json: 'json_value' };
            await cassandraClient.updateConfig({ key: objectToSave });

            clientBatchStub.getCall(0).args[0][0].query.should.eql(query);
            clientBatchStub.getCall(0).args[0][0].params[0].should.eql('key');
            clientBatchStub.getCall(0).args[0][0].params[1].should.eql(JSON.stringify(objectToSave));
        });
    });

    describe('Upsert new config multiple records object and strings as value', () => {
        it('should succeed object value update', async () => {
            clientBatchStub.resolves({ result: { rowLength: 0 } });
            let query = 'INSERT INTO config(key, value) values(?,?)';
            let objectToSave = { object_key: 'test_key' };
            await cassandraClient.updateConfig({ stringValue: 'test_string', objectValue: objectToSave });

            clientBatchStub.getCall(0).args[0][0].query.should.eql(query);
            clientBatchStub.getCall(0).args[0][0].params[0].should.eql('stringValue');
            clientBatchStub.getCall(0).args[0][0].params[1].should.eql('test_string');
            clientBatchStub.getCall(0).args[0][1].params[0].should.eql('objectValue');
            clientBatchStub.getCall(0).args[0][1].params[1].should.eql(JSON.stringify(objectToSave));
        });
    });

    describe('get all config', () => {
        it('should succeed get config', async () => {
            clientExecuteStub.resolves(new Promise((resolve, reject) => {
                resolve({});
            }));
            let query = 'SELECT* FROM config';
            await cassandraClient.getConfig();

            clientExecuteStub.getCall(0).args[0].should.eql(query);
        });
    });

    describe('get config by value multple ', () => {
        it('should succeed get config', async () => {
            clientExecuteStub.resolves(new Promise((resolve, reject) => {
                resolve({});
            }));
            let query = 'SELECT* FROM config WHERE key= ?';
            await cassandraClient.getConfigValue('value_test');

            clientExecuteStub.getCall(0).args[0].should.eql(query);
            clientExecuteStub.getCall(0).args[1].should.eql('value_test');
        });
    });

    describe('handle cassandra execute error ', () => {
        it('should reject request with error', async () => {
            clientExecuteStub.throws();
            let errorText = 'Error occurred in communication with cassandra';

            cassandraClient.getConfigValue('value_test').then(() => {
                throw new Error('Expected to catch error!');
            }, (err) => {
                should(err.message).eql(errorText);
            });
        });
    });
    describe('handle cassandra batch error ', () => {
        it('should reject request with error', async () => {
            clientBatchStub.throws();
            let errorText = 'Error occurred in communication with cassandra';

            cassandraClient.updateConfig({}).then(() => {
                throw new Error('Expected to catch error!');
            }, (err) => {
                should(err.message).eql(errorText);
            });
        });
    });
});