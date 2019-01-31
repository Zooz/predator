'use strict';
let sinon = require('sinon');
let logger = require('../../../../src/common/logger');
let driver = require('cassandra-driver');
let rewire = require('rewire');
let should = require('should');
let cassandraClient = rewire('../../../../src/jobs/models/database/cassandra/cassandraConnector');

let uuid = require('uuid');

describe('Cassandra client tests', function() {
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

    describe('Init and shutdown tests', function(){
        it('it should initialize cassandra client successfully', (done) => {
            try {
                cassandraClient.init({ execute: clientExecuteStub });
            } catch (e) {
                e.should.be.equal(undefined);
                e.should.not.be.instanceOf(Error);
            }
            done();
        });
    });

    describe('Insert new test tests', function(){
        it('should succeed simple insert', function(){
            clientExecuteStub.resolves({ result: { rowLength: 0 } });
            let id = uuid.v4();
            let testId = uuid.v4();

            let query = 'INSERT INTO jobs(id, test_id, arrival_rate, cron_expression, duration, emails, environment, ramp_to, webhooks) values(?,?,?,?,?,?,?,?,?)';
            return cassandraClient.insertJob(id, { test_id: testId, arrival_rate: 1, duration: 1, cron_expression: '* * * *', emails: {}, environment: 'test', ramp_to: '1', webhooks: 1 })
                .then(function(){
                    loggerErrorStub.callCount.should.eql(0);
                    clientExecuteStub.getCall(0).args[0].should.eql(query);
                    clientExecuteStub.getCall(0).args[1][0].should.eql(id);
                    clientExecuteStub.getCall(0).args[1][1].should.eql(testId);
                });
        });

        it('should log error for failing inserting new test', function(){
            clientExecuteStub.rejects();
            return cassandraClient.insertJob(uuid.v4(), { test_id: uuid.v4(), arrival_rate: 1, duration: 1, cron_expression: '* * * *', emails: {}, environment: 'test', ramp_to: '1', webhooks: 1 })
                .catch(function(){
                    loggerErrorStub.callCount.should.eql(1);
                });
        });
    });

    describe('Get jobs', function(){
        it('should get multiple jobs', function(){
            let cassandraResponse = { rows: [{ id: 'id', test_id: 'test_id', arrival_rate: 1, duration: 1, cron_expression: null, emails: null, webhooks: null, ramp_to: '1' }] };
            clientExecuteStub.resolves(cassandraResponse);

            let query = 'SELECT * FROM jobs';
            return cassandraClient.getJobs()
                .then(function(result){
                    loggerErrorStub.callCount.should.eql(0);
                    clientExecuteStub.getCall(0).args[0].should.eql(query);
                    result.should.eql(cassandraResponse.rows);
                });
        });

        it('should get failure from cassandra', function(){
            clientExecuteStub.rejects(new Error('error'));

            let query = 'SELECT * FROM jobs';
            return cassandraClient.getJobs()
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

    describe('Get job', function(){
        it('should get single job', function(){
            clientExecuteStub.resolves({ rows: [{ id: 'id', test_id: 'test_id', arrival_rate: 1, duration: 1, cron_expression: null, emails: null, webhooks: null, ramp_to: '1' }] });
            let jobId = uuid.v4();
            let query = 'SELECT * FROM jobs WHERE id=?';
            return cassandraClient.getJob(jobId)
                .then(function(result){
                    clientExecuteStub.getCall(0).args[0].should.eql(query);
                    clientExecuteStub.getCall(0).args[1][0].should.eql(jobId);
                });
        });
    });

    describe('Delete job', function(){
        it('should delete single job', function(){
            clientExecuteStub.resolves({ rows: [] });
            let jobId = uuid.v4();
            let query = 'DELETE FROM jobs WHERE id=?';
            return cassandraClient.deleteJob(jobId)
                .then(function(result){
                    clientExecuteStub.getCall(0).args[0].should.eql(query);
                    clientExecuteStub.getCall(0).args[1][0].should.eql(jobId);
                    result.should.eql([]);
                });
        });

        it('should get failure from cassandra', function(){
            clientExecuteStub.rejects(new Error('error'));
            let jobId = uuid.v4();
            let query = 'DELETE FROM jobs WHERE id=?';
            return cassandraClient.deleteJob(jobId)
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

    describe('Update job', function(){
        it('should succeed update of one parameter', function(){
            clientExecuteStub.onCall(0).resolves({ rows: [{ column_name: 'test_id' }] });
            clientExecuteStub.resolves({ result: { rowLength: 0 } });
            cassandraClient.__set__('databaseConfig', { name: 'keyspace' });
            let id = uuid.v4();
            let testId = uuid.v4();

            let updateQuery = 'UPDATE jobs SET test_id=? WHERE id=? IF EXISTS';
            let columnQuery = 'SELECT * FROM system_schema.columns WHERE keyspace_name = ? AND table_name = \'jobs\'';
            return cassandraClient.updateJob(id, { test_id: testId })
                .then(function(){
                    loggerErrorStub.callCount.should.eql(0);
                    clientExecuteStub.getCall(0).args[0].should.eql(columnQuery);
                    clientExecuteStub.getCall(0).args[1][0].should.eql('keyspace');
                    clientExecuteStub.getCall(1).args[0].should.eql(updateQuery);
                    clientExecuteStub.getCall(1).args[1][1].should.eql(id);
                    clientExecuteStub.getCall(1).args[1][0].should.eql(testId);
                });
        });

        it('should succeed update more than one parameter', function(){
            cassandraClient.__set__('columns', undefined);
            clientExecuteStub.onCall(0).resolves({ rows: [{ column_name: 'test_id' }, { column_name: 'duration' }] });
            clientExecuteStub.resolves({ result: { rowLength: 0 } });
            let id = uuid.v4();
            let testId = uuid.v4();

            let query = 'UPDATE jobs SET test_id=?, duration=? WHERE id=? IF EXISTS';
            let columnQuery = 'SELECT * FROM system_schema.columns WHERE keyspace_name = ? AND table_name = \'jobs\'';
            return cassandraClient.updateJob(id, { test_id: testId, duration: 4 })
                .then(function(){
                    loggerErrorStub.callCount.should.eql(0);
                    clientExecuteStub.getCall(0).args[0].should.eql(columnQuery);
                    clientExecuteStub.getCall(0).args[1][0].should.eql('keyspace');
                    clientExecuteStub.getCall(1).args[0].should.eql(query);
                    clientExecuteStub.getCall(1).args[1][2].should.eql(id);
                    clientExecuteStub.getCall(1).args[1][1].should.eql(4);
                    clientExecuteStub.getCall(1).args[1][0].should.eql(testId);
                });
        });

        it('should ignore none existing parameter in the update', function(){
            cassandraClient.__set__('columns', undefined);
            clientExecuteStub.onCall(0).resolves({ rows: [{ column_name: 'test_id' }] });
            clientExecuteStub.resolves({ result: { rowLength: 0 } });
            let id = uuid.v4();
            let testId = uuid.v4();

            let query = 'UPDATE jobs SET test_id=? WHERE id=? IF EXISTS';
            let columnQuery = 'SELECT * FROM system_schema.columns WHERE keyspace_name = ? AND table_name = \'jobs\'';
            return cassandraClient.updateJob(id, { test_id: testId, duration: 4 })
                .then(function(){
                    loggerErrorStub.callCount.should.eql(0);
                    clientExecuteStub.getCall(0).args[0].should.eql(columnQuery);
                    clientExecuteStub.getCall(0).args[1][0].should.eql('keyspace');
                    clientExecuteStub.getCall(1).args[0].should.eql(query);
                    clientExecuteStub.getCall(1).args[1][1].should.eql(id);
                    clientExecuteStub.getCall(1).args[1][0].should.eql(testId);
                });
        });

        it('should log error for failing updating new test', function(){
            clientExecuteStub.onCall(0).resolves({ rows: [{ column_name: 'test_id' }] });
            clientExecuteStub.rejects();
            return cassandraClient.updateJob(uuid.v4(), { test_id: uuid.v4() })
                .catch(function(){
                    loggerErrorStub.callCount.should.eql(1);
                });
        });

        ['id', 'job_id'].forEach(function(idName){
            it('should reject an error for trying to update ' + idName, function(){
                cassandraClient.__set__('columns', undefined);
                clientExecuteStub.onCall(0).resolves({ rows: [{ column_name: 'test_id' }] });
                cassandraClient.__set__('databaseConfig', { name: 'keyspace' });

                let query = 'SELECT * FROM system_schema.columns WHERE keyspace_name = ? AND table_name = \'jobs\'';
                return cassandraClient.updateJob(uuid.v4(), { [idName]: 'something' })
                    .catch(function(err){
                        err.statusCode.should.eql(400);
                        err.message.should.eql('Job id can not be updated');
                        clientExecuteStub.getCall(0).args[0].should.eql(query);
                        clientExecuteStub.getCall(0).args[1][0].should.eql('keyspace');
                    });
            });
        });
    });
});