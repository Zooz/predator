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

    describe('init', function() {
        it('should assign the cassandra client successfully', function () {
            const prevClient = cassandraClient.__get__('client');
            const newClient = { clientId: 'fake-client' };
            cassandraClient.init(newClient);
            const updatedClient = cassandraClient.__get__('client');
            updatedClient.should.equal(newClient);
            cassandraClient.__set__('client', prevClient);
        });
    });

    describe('Insert new processor', function(){
        it('should succeed simple insert', function(){
            clientExecuteStub.resolves({ result: { rowLength: 0 } });
            let id = uuid.v4();

            let query = cassandraClient._queries.INSERT_PROCESSOR;
            return cassandraClient.insertProcessor(id, { name: 'mick', description: 'some processor', javascript: 'module.exports.mick = \'ey\'' })
                .then(function(){
                    loggerErrorStub.callCount.should.eql(0);
                    clientExecuteStub.getCall(0).args[0].should.eql(query);
                    clientExecuteStub.getCall(0).args[1][0].should.eql(id);
                });
        });

        it('should log error for failing inserting new processor', function(){
            clientExecuteStub.rejects();
            return cassandraClient.insertProcessor('id', { name: 'mick', description: 'some processor', javascript: 'module.exports.mick = \'ey\'' })
                .catch(function(){
                    loggerErrorStub.callCount.should.eql(2);
                });
        });
    });

    describe('Get processors', function(){
        it('should get multiple processors', function(){
            let cassandraResponse = { rows: [{ id: 'id', name: 'mick', description: 'some processor', javascript: 'module.exports.mick = \'ey\'', created_at: Date.now(), updated_at: Date.now() }] };
            clientExecuteStub.resolves(cassandraResponse);

            let query = 'SELECT * FROM processors';
            return cassandraClient.getAllProcessors()
                .then(function(result){
                    loggerErrorStub.callCount.should.eql(0);
                    clientExecuteStub.getCall(0).args[0].should.eql(query);
                    result.should.eql(cassandraResponse.rows);
                });
        });

        it('should get multiple processors while excluding javascript', function(){
            let cassandraResponse = { rows: [{ id: 'id', name: 'mick', description: 'some processor', javascript: 'module.exports.mick = \'ey\'', created_at: Date.now(), updated_at: Date.now() }] };
            clientExecuteStub.resolves(cassandraResponse);

            let query = 'SELECT id, name, description, created_at, updated_at, exported_functions FROM processors';
            return cassandraClient.getAllProcessors(undefined, undefined, 'javascript')
                .then(function(result){
                    loggerErrorStub.callCount.should.eql(0);
                    clientExecuteStub.getCall(0).args[0].should.eql(query);
                    result.should.eql(cassandraResponse.rows);
                });
        });

        it('should get failure from cassandra', function(){
            clientExecuteStub.rejects(new Error('error'));

            let query = cassandraClient._queries.GET_ALL_PROCESSORS;
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

    describe('Get processor', function() {
        describe('getProcessorById', function() {
            it('should get a single processor', function(){
                clientExecuteStub.resolves({ rows: [{ id: 'id', name: 'mick', description: 'some processor', javascript: 'module.exports.mick = \'ey\'', created_at: Date.now(), updated_at: Date.now() }] });
                let proccesorId = uuid.v4();
                let query = cassandraClient._queries.GET_PROCESSOR_BY_ID;
                return cassandraClient.getProcessorById(proccesorId)
                    .then(function(result){
                        clientExecuteStub.getCall(0).args[0].should.eql(query);
                        clientExecuteStub.getCall(0).args[1][0].should.eql(proccesorId);
                        should(result).containDeep({ id: 'id', name: 'mick', description: 'some processor', javascript: 'module.exports.mick = \'ey\'' });
                    });
            });
        });

        describe('updateProcessor', function() {
            it('should update the execute the update query sucessfully', async function() {
                const getProcessorQuery = cassandraClient._queries.GET_PROCESSOR_BY_ID;
                const updateProcessorQuery = cassandraClient._queries.UPDATE_PROCESSOR;
                const deleteProcessorMapping = cassandraClient._queries.DELETE_PROCESSOR_MAPPING;
                const insertProcessorMapping = cassandraClient._queries.INSERT_PROCESSOR_MAPPING;
                const processorId = uuid.v4();
                const processor = {
                    id: processorId,
                    name: 'updated processor name',
                    description: 'some processor',
                    javascript: 'module.exports.mick = \'ey\'',
                    created_at: Date.now()
                };
                const processorMapping = {
                    name: processor.name,
                    id: processorId
                };
                clientExecuteStub.withArgs(getProcessorQuery).resolves({ rows: [processor] });
                clientExecuteStub.withArgs(updateProcessorQuery).resolves({ rows: [processor] });
                clientExecuteStub.withArgs(insertProcessorMapping).resolves({ rows: [processorMapping] });
                clientExecuteStub.withArgs(deleteProcessorMapping).resolves({ rows: [] });
                cassandraClient.updateProcessor(processorId, processor).then(result => {
                    clientExecuteStub.getCall(0).args[0].should.eql(getProcessorQuery);
                    clientExecuteStub.getCall(0).args[1][0].should.eql(processorId);
                    clientExecuteStub.getCall(1).args[0].should.eql(updateProcessorQuery);
                    clientExecuteStub.getCall(1).args[1][0].should.eql(processor.name);
                    clientExecuteStub.getCall(2).args[0].should.eql(insertProcessorMapping);
                    clientExecuteStub.getCall(2).args[1][0].should.eql(processor.name);
                    clientExecuteStub.getCall(2).args[1][1].should.eql(processor.id);
                    clientExecuteStub.getCall(3).args[0].should.eql(deleteProcessorMapping);
                    clientExecuteStub.getCall(3).args[1][0].should.eql(processor.name);
                    should(result).containDeep(processor);
                });
            });
        });

        describe('getProcessorByName', function() {
            it('should get a single processor', function() {
                let processorId = uuid.v4();
                let processorName = 'Generate Random Kitty Name';
                const processor = {
                    id: processorId,
                    name: processorName,
                    description: 'some processor',
                    javascript: 'module.exports.mick = \'ey\'',
                    created_at: Date.now(),
                    updated_at: Date.now()
                };
                const processorMapping = {
                    name: processorName,
                    id: processorId
                };
                let query = cassandraClient._queries.GET_PROCESSOR_BY_ID;
                let mappingQuery = cassandraClient._queries.GET_PROCESSOR_MAPPING;
                clientExecuteStub.withArgs(mappingQuery).resolves({ rows: [processorMapping] });
                clientExecuteStub.withArgs(query).resolves({ rows: [processor] });
                return cassandraClient.getProcessorByName(processorName)
                    .then(function(result) {
                        clientExecuteStub.getCall(0).args[0].should.eql(mappingQuery);
                        clientExecuteStub.getCall(0).args[1][0].should.eql(processorName);
                        clientExecuteStub.getCall(1).args[0].should.eql(query);
                        clientExecuteStub.getCall(1).args[1][0].should.eql(processorId);
                        should(result).containDeep(processor);
                    });
            });
        });
    });

    describe('Delete processor', function(){
        it('should delete single processor', function(){
            const processorId = uuid.v4();
            const processorMapping = {
                name: 'mick',
                id: processorId
            };
            const getProcessorQuery = cassandraClient._queries.GET_PROCESSOR_BY_ID;
            const deleteProcessorQuery = cassandraClient._queries.DELETE_PROCESSOR;
            const deleteMappingQuery = cassandraClient._queries.DELETE_PROCESSOR_MAPPING;
            clientExecuteStub.withArgs(getProcessorQuery).resolves({ rows: [processorMapping] });
            clientExecuteStub.withArgs(deleteProcessorQuery).resolves({ rows: [] });
            clientExecuteStub.withArgs(deleteMappingQuery).resolves({ rows: [] });

            return cassandraClient.deleteProcessor(processorId)
                .then(function(result){
                    clientExecuteStub.callCount.should.eql(3);
                    clientExecuteStub.getCall(0).args[0].should.eql(getProcessorQuery);
                    clientExecuteStub.getCall(0).args[1][0].should.eql(processorMapping.id);
                    clientExecuteStub.getCall(1).args[0].should.eql(deleteProcessorQuery);
                    clientExecuteStub.getCall(1).args[1][0].should.eql(processorId);
                    clientExecuteStub.getCall(2).args[0].should.eql(deleteMappingQuery);
                    clientExecuteStub.getCall(2).args[1][0].should.eql(processorMapping.name);
                    result.should.eql([[], []]);
                });
        });

        it('should get failure from cassandra', function(){
            let processorId = uuid.v4();
            const processorMapping = {
                id: processorId,
                name: 'mick'
            };
            let getProcessorMapping = cassandraClient._queries.GET_PROCESSOR_BY_ID;
            let deleteProcessorQuery = cassandraClient._queries.DELETE_PROCESSOR;
            clientExecuteStub.withArgs(getProcessorMapping).resolves({ rows: [processorMapping] });
            clientExecuteStub.withArgs(deleteProcessorQuery).rejects(new Error('error'));
            return cassandraClient.deleteProcessor(processorId)
                .then(function(){
                    return Promise.reject(new Error('should not get here'));
                }).catch(function(err) {
                    clientExecuteStub.getCall(0).args[0].should.eql(getProcessorMapping);
                    loggerErrorStub.callCount.should.eql(1);
                    loggerErrorStub.args[0][1].message.should.eql('error');
                    err.message.should.eql('Error occurred in communication with cassandra');
                });
        });
    });
});
