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
        'errors': { EAI_AGAIN: 112, NOTREACH: 123 },
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

    let testId, revisionId, reportId, jobId, testType, startTime, testName, testDescription, testConfiguration, notes, lastUpdatedAt, phase;

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
        startTime = new Date('1/10/2017')
        testName = 'testName';
        testDescription = 'testDescription';
        testConfiguration = 'testConfiguration';
        notes = 'notes';
        lastUpdatedAt = Date.now();
        phase = '0';
    });

    afterEach(() => {
        sandbox.resetHistory();
        clientExecuteStub.reset();
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

    describe('Insert new report', function () {
        it('should succeed simple insert', function () {
            clientExecuteStub.resolves({ rowLength: 1, rows: [{ '[applied]': true }] });
            let queryReport = 'INSERT INTO reports_summary(test_id, revision_id, report_id, job_id, test_type, phase, start_time, test_name, test_description, test_configuration, notes, last_updated_at) values(?,?,?,?,?,?,?,?,?,?,?,?) IF NOT EXISTS';
            let queryLastReport = 'INSERT INTO last_reports(start_time_year,start_time_month,test_id, revision_id, report_id, job_id, test_type, phase, start_time, test_name, test_description, test_configuration, notes, last_updated_at) values(?,?,?,?,?,?,?,?,?,?,?,?,?,?) IF NOT EXISTS';
            return cassandraClient.insertReport(testId, revisionId, reportId, jobId, testType, phase, startTime, testName, testDescription, testConfiguration, notes, lastUpdatedAt)
                .then(function () {
                    clientExecuteStub.getCall(0).args[0].should.eql(queryReport);
                    clientExecuteStub.getCall(0).args[1][0].should.eql(testId);
                    clientExecuteStub.getCall(0).args[1][1].should.eql(revisionId);
                    clientExecuteStub.getCall(0).args[1][2].should.eql(reportId);
                    loggerErrorStub.callCount.should.eql(0);
                    clientExecuteStub.getCall(1).args[0].should.eql(queryLastReport);
                    clientExecuteStub.getCall(1).args[1][0].should.eql(2017);
                    clientExecuteStub.getCall(1).args[1][1].should.eql(1);
                    clientExecuteStub.getCall(1).args[1][2].should.eql(testId);
                    clientExecuteStub.getCall(1).args[1][3].should.eql(revisionId);
                    clientExecuteStub.getCall(1).args[1][4].should.eql(reportId);
                });
        });

        it('should log error for failing inserting new report', function(){
            clientExecuteStub.rejects();
            return cassandraClient.insertReport(testId, revisionId, reportId, jobId, testType, phase, startTime, testName, testDescription, testConfiguration, notes, lastUpdatedAt)
                .catch(function(){
                    loggerErrorStub.callCount.should.eql(1);
                });
        });
    });

    describe('Update report and verify last report updated', function () {
        it('should succeed simple insert', function () {
            const phase = uuid();
            clientExecuteStub.resolves({ result: { rowLength: 0 } });
            let queryLastReport = 'UPDATE last_reports SET phase=?, last_updated_at=? WHERE start_time_year=? AND start_time_month=? AND start_time =? test_id=? AND report_id=?';
            return cassandraClient.updateReport(testId, reportId, phase, lastUpdatedAt, '01/22/2017')
                .then(function () {
                    loggerErrorStub.callCount.should.eql(0);
                    clientExecuteStub.getCall(0).args[0].should.eql(queryLastReport);
                    clientExecuteStub.getCall(0).args[1][0].should.eql(phase);
                    clientExecuteStub.getCall(0).args[1][1].should.eql(lastUpdatedAt);
                    clientExecuteStub.getCall(0).args[1][2].should.eql(2017);
                    clientExecuteStub.getCall(0).args[1][3].should.eql(1);
                    clientExecuteStub.getCall(0).args[1][4].should.eql('01/22/2017');
                    clientExecuteStub.getCall(0).args[1][5].should.eql(testId);
                    clientExecuteStub.getCall(0).args[1][6].should.eql(reportId);
                });
        });
    })
    describe('Get report', function(){
        it('should get single report', function(){
            let cassandraResponse = { rows: [REPORT] };
            clientExecuteStub.resolves(cassandraResponse);

            let query = 'SELECT * FROM reports_summary WHERE test_id=? AND report_id=?';
            return cassandraClient.getReport()
                .then(function(result){
                    loggerErrorStub.callCount.should.eql(0);
                    clientExecuteStub.getCall(0).args[0].should.eql(query);
                    result.should.eql(cassandraResponse.rows);
                });
        });

        it('should get failure from cassandra', function(){
            clientExecuteStub.rejects(new Error('error'));

            let query = 'SELECT * FROM reports_summary WHERE test_id=? AND report_id=?';
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

    describe('Get last report success', function(){
        it('should get last reports', function(){
            let cassandraResponse = { rows: [REPORT, REPORT, REPORT] };
            clientExecuteStub.onCall(0).resolves({ rows: [REPORT] });
            clientExecuteStub.onCall(1).resolves({ rows: [REPORT] });
            clientExecuteStub.onCall(2).resolves({ rows: [REPORT] });
            clientExecuteStub.resolves({ rows: [REPORT] });

            let query = 'SELECT * FROM last_reports WHERE start_time_year=? AND start_time_month=? LIMIT ?';
            return cassandraClient.getLastReports(3)
                .then(function (result) {
                    const date = new Date();
                    loggerErrorStub.callCount.should.eql(0);
                    clientExecuteStub.getCall(0).args[0].should.eql(query);
                    clientExecuteStub.getCall(0).args[1][0].should.eql(date.getFullYear());
                    clientExecuteStub.getCall(0).args[1][1].should.eql(date.getMonth() + 1);
                    clientExecuteStub.getCall(0).args[1][2].should.eql(3);
                    result.should.eql(cassandraResponse.rows);
                    sandbox.resetHistory();
                });
        });
    });

    describe('Get last report fail', function () {
        it('should get failure from cassandra', function () {
            clientExecuteStub.rejects(new Error('error'));

            let query = 'SELECT * FROM reports_summary WHERE test_id=? AND report_id=?';
            return cassandraClient.getReport()
                .then(function (result) {
                    return Promise.reject(new Error('should not get here'));
                }).catch(function (err) {
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

            let query = 'SELECT * FROM reports_summary WHERE test_id=?';
            return cassandraClient.getReports()
                .then(function(result){
                    loggerErrorStub.callCount.should.eql(0);
                    clientExecuteStub.getCall(0).args[0].should.eql(query);
                    result.should.eql(cassandraResponse.rows);
                });
        });

        it('should get failure from cassandra', function(){
            clientExecuteStub.rejects(new Error('error'));

            let query = 'SELECT * FROM reports_summary WHERE test_id=?';
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
        const runnerId = uuid();
        const statId = uuid();
        const statsTime = new Date().getTime();
        const phaseIndex = uuid(0);
        const phaseStatus = uuid('started');
        const data = JSON.stringify({ median: 5 });

        it('should succeed simple insert', function(){
            clientExecuteStub.resolves({ result: { rowLength: 0 } });
            let query = 'INSERT INTO reports_stats(runner_id, test_id, report_id, stats_id, stats_time, phase_index, phase_status, data) values(?,?,?,?,?,?,?,?)';
            return cassandraClient.insertStats(runnerId, testId, reportId, statId, statsTime, phaseIndex, phaseStatus, data)
                .then(function(){
                    loggerErrorStub.callCount.should.eql(0);
                    clientExecuteStub.getCall(0).args[0].should.eql(query);
                    clientExecuteStub.getCall(0).args[1][0].should.eql(runnerId);
                    clientExecuteStub.getCall(0).args[1][1].should.eql(testId);
                    clientExecuteStub.getCall(0).args[1][2].should.eql(reportId);
                    clientExecuteStub.getCall(0).args[1][3].should.eql(statId);
                });
        });

        it('should log error for failing inserting new report', function(){
            clientExecuteStub.rejects();
            return cassandraClient.insertStats(runnerId, testId, reportId, statId, statsTime, phaseIndex, phaseStatus, data)
                .catch(function(){
                    loggerErrorStub.callCount.should.eql(1);
                });
        });
    });

    describe('Subscribe Runner', function(){
        it('should subscribe runner to report', function(){
            clientExecuteStub.resolves({ result: { rowLength: 0 } });

            let query = 'INSERT INTO report_subscribers(test_id, report_id, runner_id, phase_status) values(?,?,?,?)';
            return cassandraClient.subscribeRunner('test_id', 'report_id', 'runner_id', 'initializing')
                .then(function(result){
                    loggerErrorStub.callCount.should.eql(0);
                    clientExecuteStub.getCall(0).args[0].should.eql(query);
                    clientExecuteStub.getCall(0).args[1][0].should.eql('test_id');
                    clientExecuteStub.getCall(0).args[1][1].should.eql('report_id');
                    clientExecuteStub.getCall(0).args[1][2].should.eql('runner_id');
                    clientExecuteStub.getCall(0).args[1][3].should.eql('initializing');
                });
        });

        it('should get failure from cassandra', function(){
            clientExecuteStub.rejects(new Error('error'));

            let query = 'SELECT * FROM reports_summary WHERE test_id=?';
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

    describe('Update Subscriber', function(){
        it('should update subscriber stage in report without stats', function(){
            let cassandraResponse = { rows: [REPORT] };
            clientExecuteStub.resolves(cassandraResponse);

            let query = 'UPDATE report_subscribers SET phase_status=? WHERE test_id=? AND report_id=? AND runner_id=?';
            return cassandraClient.updateSubscriber('test_id', 'report_id', 'runner_id', 'intermediate')
                .then(function(result){
                    loggerErrorStub.callCount.should.eql(0);
                    clientExecuteStub.getCall(0).args[0].should.eql(query);
                    clientExecuteStub.getCall(0).args[1][0].should.eql('intermediate');
                    clientExecuteStub.getCall(0).args[1][1].should.eql('test_id');
                    clientExecuteStub.getCall(0).args[1][2].should.eql('report_id');
                    clientExecuteStub.getCall(0).args[1][3].should.eql('runner_id');
                });
        });

        it('should update subscriber stage in report with stats', function(){
            let cassandraResponse = { rows: [REPORT] };
            clientExecuteStub.resolves(cassandraResponse);

            let query = 'UPDATE report_subscribers SET phase_status=?, last_stats=? WHERE test_id=? AND report_id=? AND runner_id=?';
            return cassandraClient.updateSubscriberWithStats('test_id', 'report_id', 'runner_id', 'intermediate', 'last_stats')
                .then(function(result){
                    loggerErrorStub.callCount.should.eql(0);
                    clientExecuteStub.getCall(0).args[0].should.eql(query);
                    clientExecuteStub.getCall(0).args[1][0].should.eql('intermediate');
                    clientExecuteStub.getCall(0).args[1][1].should.eql('last_stats');
                    clientExecuteStub.getCall(0).args[1][2].should.eql('test_id');
                    clientExecuteStub.getCall(0).args[1][3].should.eql('report_id');
                    clientExecuteStub.getCall(0).args[1][4].should.eql('runner_id');
                });
        });
    });
});
