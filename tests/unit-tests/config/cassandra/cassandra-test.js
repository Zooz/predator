'use strict';
let sinon = require('sinon');
let driver = require('cassandra-driver');
let rewire = require('rewire');
let should = require('should');
let cassandraClient = rewire('../../../../src/configManager/models/database/cassandra/cassandraConnector');

describe('Cassandra client tests', function() {
    let sandbox;
    let clientBatchStub;
    let revert;

    before(() => {
        sandbox = sinon.sandbox.create();
        clientBatchStub = sandbox.stub(driver.Client.prototype, 'batch');
        revert = cassandraClient.__set__('client', { batch: clientBatchStub });
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
});