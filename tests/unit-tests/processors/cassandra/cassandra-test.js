'use strict';
let sinon = require('sinon');
let logger = require('../../../../src/common/logger');
let driver = require('cassandra-driver');
let rewire = require('rewire');
let should = require('should');
let cassandraClient = rewire('../../../../src/processors/models/database/cassandra/cassandraConnector');

let uuid = require('uuid');

describe('Cassandra processors tests', function() {
    let sandbox;
    let clientExecuteStub;
    let revert;
    let loggerErrorStub;

    before(() => {
        sandbox = sinon.sandbox.create();
        clientExecuteStub = sandbox.stub(driver.Client.prototype, 'execute');
        revert = cassandraClient.__set__('client', { execute: clientExecuteStub });
        loggerErrorStub = sandbox.stub(logger, 'error');
    });

    afterEach(() => {
        sandbox.resetHistory();
    });

    after(() => {
        sandbox.restore();
        revert();
    });

    describe('Insert new processor', function(){
        it('should succeed simple insert', function(){
            clientExecuteStub.resolves({ result: { rowLength: 0 } });
            let id = uuid.v4();

            let query = 'INSERT INTO processors(id, name, description, javascript, created_at, updated_at) values(?,?,?,?,?,?)';
            return cassandraClient.insertProcessor(id, {  name: 'mick', description: 'some processor', javascript: `module.exports.mick = 'ey'` })
                .then(function(){
                    loggerErrorStub.callCount.should.eql(0);
                    clientExecuteStub.getCall(0).args[0].should.eql(query);
                    clientExecuteStub.getCall(0).args[1][0].should.eql(id);
                });
        });

        it('should log error for failing inserting new processor', function(){
            clientExecuteStub.rejects();
            return cassandraClient.insertProcessor('id', {  name: 'mick', description: 'some processor', javascript: `module.exports.mick = 'ey'` })
                .catch(function(){
                    loggerErrorStub.callCount.should.eql(1);
                });
        });
    });

    describe('Get processors', function(){
        it('should get multiple processors', function(){
            let cassandraResponse = { rows: [{ id: 'id', name: 'mick', description: 'some processor', javascript: `module.exports.mick = 'ey'`, created_at: Date.now(), updated_at: Date.now() }] };
            clientExecuteStub.resolves(cassandraResponse);

            let query = 'SELECT * FROM processors';
            return cassandraClient.getAllProcessors()
                .then(function(result){
                    loggerErrorStub.callCount.should.eql(0);
                    clientExecuteStub.getCall(0).args[0].should.eql(query);
                    result.should.eql(cassandraResponse.rows);
                });
        });

        it('should get failure from cassandra', function(){
            clientExecuteStub.rejects(new Error('error'));

            let query = 'SELECT * FROM processors';
            return cassandraClient.getAllProcessors()
                .then(function(result){
                    return Promise.reject(new Error('should not get here'));
                }).catch(function(err) {
                    clientExecuteStub.getCall(0).args[0].should.eql(query);
                    loggerErrorStub.callCount.should.eql(1);
                    loggerErrorStub.args[0][1].message.should.eql('error');
                    err.message.should.eql('Error occurred in communication with cassandra');
                });
        });
    });

    describe('Get processor', function(){
        it('should get single processor', function(){
            clientExecuteStub.resolves({ rows: [{ id: 'id', name: 'mick', description: 'some processor', javascript: `module.exports.mick = 'ey'`, created_at: Date.now(), updated_at: Date.now() }] });
            let proccesorId = uuid.v4();
            let query = 'SELECT * FROM processors WHERE id=?';
            return cassandraClient.getProcessor(proccesorId)
                .then(function(result){
                    clientExecuteStub.getCall(0).args[0].should.eql(query);
                    clientExecuteStub.getCall(0).args[1][0].should.eql(proccesorId);
                    should(result).containDeep({ id: 'id', name: 'mick', description: 'some processor', javascript: `module.exports.mick = 'ey'` });
                });
        });
    });

    describe('Delete processor', function(){
        it('should delete single processor', function(){
            clientExecuteStub.resolves({ rows: [] });
            let processorId = uuid.v4();
            let query = 'DELETE FROM processors WHERE id=?';
            return cassandraClient.deleteProcessor(processorId)
                .then(function(result){
                    clientExecuteStub.getCall(0).args[0].should.eql(query);
                    clientExecuteStub.getCall(0).args[1][0].should.eql(processorId);
                    result.should.eql([]);
                });
        });

        it('should get failure from cassandra', function(){
            clientExecuteStub.rejects(new Error('error'));
            let processorId = uuid.v4();
            let query = 'DELETE FROM processors WHERE id=?';
            return cassandraClient.deleteProcessor(processorId)
                .then(function(){
                    return Promise.reject(new Error('should not get here'));
                }).catch(function(err) {
                    clientExecuteStub.getCall(0).args[0].should.eql(query);
                    loggerErrorStub.callCount.should.eql(1);
                    loggerErrorStub.args[0][1].message.should.eql('error');
                    err.message.should.eql('Error occurred in communication with cassandra');
                });
        });
    });
});