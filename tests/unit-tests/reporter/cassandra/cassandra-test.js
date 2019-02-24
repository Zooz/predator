'use strict';
let sinon = require('sinon');
let logger = require('../../../../src/common/logger');
let driver = require('cassandra-driver');
let rewire = require('rewire');
let should = require('should');
let cassandraClient = rewire('../../../../src/reports/models/database/cassandra/cassandraConnector');

let uuid = require('uuid');

const REPORT = {
    'test_id': 'test id',
    'revision_id': 'revision_id',
    'report_id': 'report_id',
    'test_name': 'test name',
    'report_url': 'http://www.zooz.com',
    'last_stats': JSON.stringify({
        'timestamp': '2018-05-28T15:40:10.044Z',
        'scenariosCreated': 289448,
        'scenariosCompleted': 289447,
        'requestsCompleted': 694611,
        'latency': {
            'min': 6.3,
            'max': 3822.8,
            'median': 58.8,
            'p95': 115.5,
            'p99': 189.4
        },
        'rps': {
            'count': 694611,
            'mean': 178.61
        },
        'scenarioDuration': {
            'min': 80.4,
            'max': 5251.7,
            'median': 146.8,
            'p95': 244.4,
            'p99': 366.6
        },
        'scenarioCounts': {
            'Create token and get token': 173732,
            'Create token, create customer and assign token to customer': 115716
        },
        'errors': {EAI_AGAIN: 112, NOTREACH: 123 },
        'codes': {
            '200': 173732,
            '201': 520878,
            '503': 1
        },
        'matches': 0,
        'customStats': {},
        'concurrency': 1510,
        'pendingRequests': 1471
    }),
    'end_time': 1527533519591,
    'start_time': 1527533459591
};

describe('Cassandra client tests', function() {
    let sandbox;
    let clientExecuteStub;
    let revert;
    let loggerErrorStub;

    let testId, revisionId, reportId, jobId, testType, startTime, testName, testDescription, testConfiguration, notes;

    before(() => {
        sandbox = sinon.sandbox.create();
        clientExecuteStub = sandbox.stub(driver.Client.prototype, 'execute');
        revert = cassandraClient.__set__('client', { execute: clientExecuteStub });
        loggerErrorStub = sandbox.stub(logger, 'error');

        testId = uuid();
        revisionId = uuid();
        reportId = uuid();
        jobId = uuid();
        testType = 'testType';
        startTime = new Date().getTime();
        testName = 'testName';
        testDescription = 'testDescription';
        testConfiguration = 'testConfiguration';
        notes = 'notes';
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

    describe('Insert new report', function(){
        it('should succeed simple insert', function(){
            clientExecuteStub.resolves({ result: { rowLength: 0 } });
            let query = 'INSERT INTO reports_summary(test_id, revision_id, report_type, report_id, job_id, test_type, status, phase, start_time, test_name, test_description, test_configuration, notes) values(?,?,?,?,?,?,?,?,?,?,?,?,?) IF NOT EXISTS';
            return cassandraClient.insertReport(testId, revisionId, reportId, jobId, testType, startTime, testName, testDescription, testConfiguration, notes)
                .then(function(){
                    loggerErrorStub.callCount.should.eql(0);
                    clientExecuteStub.getCall(0).args[0].should.eql(query);
                    clientExecuteStub.getCall(0).args[1][0].should.eql(testId);
                    clientExecuteStub.getCall(0).args[1][1].should.eql(revisionId);
                    clientExecuteStub.getCall(0).args[1][3].should.eql(reportId);
                });
        });

        it('should log error for failing inserting new report', function(){
            clientExecuteStub.rejects();
            return cassandraClient.insertReport(testId, revisionId, reportId, jobId, testType, startTime, testName, testDescription, testConfiguration, notes)
                .catch(function(){
                    loggerErrorStub.callCount.should.eql(1);
                });
        });
    });

    describe('Get report', function(){
        it('should get single report', function(){
            let cassandraResponse = { rows: [REPORT] };
            clientExecuteStub.resolves(cassandraResponse);

            let query = 'SELECT * FROM reports_summary WHERE test_id=? AND report_id=? AND report_type=?';
            return cassandraClient.getReport()
                .then(function(result){
                    loggerErrorStub.callCount.should.eql(0);
                    clientExecuteStub.getCall(0).args[0].should.eql(query);
                    result.should.eql(cassandraResponse.rows);
                });
        });

        it('should get failure from cassandra', function(){
            clientExecuteStub.rejects(new Error('error'));

            let query = 'SELECT * FROM reports_summary WHERE test_id=? AND report_id=? AND report_type=?';
            return cassandraClient.getReport()
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

    describe('Get reports', function(){
        it('should get multiple reports', function(){
            let cassandraResponse = { rows: [REPORT, REPORT] };
            clientExecuteStub.resolves(cassandraResponse);

            let query = 'SELECT * FROM reports_summary WHERE test_id=? AND report_type=?';
            return cassandraClient.getReports()
                .then(function(result){
                    loggerErrorStub.callCount.should.eql(0);
                    clientExecuteStub.getCall(0).args[0].should.eql(query);
                    result.should.eql(cassandraResponse.rows);
                });
        });

        it('should get failure from cassandra', function(){
            clientExecuteStub.rejects(new Error('error'));

            let query = 'SELECT * FROM reports_summary WHERE test_id=? AND report_type=?';
            return cassandraClient.getReports()
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

    describe('Insert new stats', function(){
        const containerId = uuid();
        const statId = uuid();
        const statsTime = new Date().getTime();
        const phaseIndex = uuid(0);
        const phaseStatus = uuid('started');
        const data = JSON.stringify({median: 5});

        it('should succeed simple insert', function(){
            clientExecuteStub.resolves({ result: { rowLength: 0 } });
            let query = 'INSERT INTO reports_stats(container_id, test_id, report_id, stats_id, stats_time, phase_index, phase_status, data) values(?,?,?,?,?,?,?,?)';
            return cassandraClient.insertStats(containerId, testId, reportId, statId, statsTime, phaseIndex, phaseStatus, data)
                .then(function(){
                    loggerErrorStub.callCount.should.eql(0);
                    clientExecuteStub.getCall(0).args[0].should.eql(query);
                    clientExecuteStub.getCall(0).args[1][0].should.eql(containerId);
                    clientExecuteStub.getCall(0).args[1][1].should.eql(testId);
                    clientExecuteStub.getCall(0).args[1][2].should.eql(reportId);
                    clientExecuteStub.getCall(0).args[1][3].should.eql(statId);
                });
        });

        it('should log error for failing inserting new report', function(){
            clientExecuteStub.rejects();
            return cassandraClient.insertStats(containerId, testId, reportId, statId, statsTime, phaseIndex, phaseStatus, data)
                .catch(function(){
                    loggerErrorStub.callCount.should.eql(1);
                });
        });
    });
});