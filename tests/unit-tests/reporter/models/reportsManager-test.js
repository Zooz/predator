'use strict';
process.env.JOB_PLATFORM = 'KUBERNETES';
const should = require('should');
const rewire = require('rewire');
const sinon = require('sinon');

const databaseConnector = require('../../../../src/reports/models/databaseConnector');
const reportsManager = rewire('../../../../src/reports/models/reportsManager');
const jobsManager = require('../../../../src/jobs/models/jobManager');
const logger = require('../../../../src/common/logger');
const constants = require('../../../../src/reports/utils/constants');
const configHandler = require('../../../../src/configManager/models/configHandler');

let manager;

const REPORT = {
    'test_id': 'test_id',
    'revision_id': 'revision_id',
    'report_id': 'report_id',
    'test_name': 'test name',
    'report_url': 'http://www.zooz.com',
    'status': constants.REPORT_INITIALIZING_STATUS,
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
    'start_time': 1527533459591,
    'grafana_report': 'http://www.grafana.com&var-Name=test%20name&from=1527533459591&to=1527533519591',
    'subscribers': [
        {
            'runner_id': '1234',
            'stage': constants.SUBSCRIBER_STARTED_STAGE
        }
    ]
};

const JOB = {
    'emails': 'eli@zooz.com',
    arrival_rate: 1,
    duration: 1,
    ramp_to: 2,
    parallelism: 1,
    max_virtual_users: 500,
    environment: 'test'
};

describe('Reports manager tests', function () {
    let sandbox;
    let loggerErrorStub;
    let loggerInfoStub;
    let databaseGetReportsStub;
    let databaseGetReportStub;
    let databaseGetLastReportsStub;
    let databasePostReportStub;
    let databasePostStatsStub;
    let databaseSubscribeRunnerStub;
    let databaseUpdateSubscribersStub;
    let databaseUpdateReportStub;
    let reportManagerUpdateReportStub;
    let getJobStub;
    let configStub;

    before(() => {
        sandbox = sinon.sandbox.create();

        databaseGetReportStub = sandbox.stub(databaseConnector, 'getReport');
        databaseGetReportsStub = sandbox.stub(databaseConnector, 'getReports');
        databaseGetLastReportsStub = sandbox.stub(databaseConnector, 'getLastReports');
        databasePostReportStub = sandbox.stub(databaseConnector, 'insertReport');
        databasePostStatsStub = sandbox.stub(databaseConnector, 'insertStats');
        databaseSubscribeRunnerStub = sandbox.stub(databaseConnector, 'subscribeRunner');
        databaseUpdateSubscribersStub = sandbox.stub(databaseConnector, 'updateSubscribers');
        databaseUpdateReportStub = sandbox.stub(databaseConnector, 'updateReport');
        loggerErrorStub = sandbox.stub(logger, 'error');
        loggerInfoStub = sandbox.stub(logger, 'info');
        getJobStub = sandbox.stub(jobsManager, 'getJob');
        configStub = sandbox.stub(configHandler, 'getConfig');

        manager = rewire('../../../../src/reports/models/reportsManager');
        manager.__set__('configHandler', {
            getConfig: () => {
                return {
                    job_platform: 'KUBERNETES',
                    external_address: 'http://www.zooz.com'
                };
            }
        });
    });

    beforeEach(() => {
        sandbox.resetHistory();
    });

    after(() => {
        sandbox.restore();
    });

    describe('Get report', function () {
        it('Database connector returns an array with one report', async () => {
            manager.__set__('configHandler', {
                getConfig: () => {
                    return { grafana_url: 'http://www.grafana.com' };
                }
            });
            databaseGetReportStub.resolves([REPORT]);
            const report = await manager.getReport();
            should.exist(report);
            should(report.last_stats).eql(JSON.parse(REPORT.last_stats));
            should.exist(report.grafana_report);
            should(report.grafana_report).eql(REPORT.grafana_report);
        });

        it('Database connector returns an array with one report without grafana url configured', async () => {
            manager.__set__('configHandler', {
                getConfig: () => {
                    return {};
                }
            });
            databaseGetReportStub.resolves([REPORT]);
            const report = await manager.getReport();
            should.exist(report);
            should(report.last_stats).eql(JSON.parse(REPORT.last_stats));
            should.not.exist(report.grafana_report);
            should(report.grafana_report).eql(undefined);
        });

        it('Database returns an empty array - should throw 404', async () => {
            databaseGetReportStub.resolves([]);
            try {
                const report = await manager.getReport();
                should.not.exist(report);
                throw new Error('should not get here');
            } catch (e) {
                should.exist(e);
                should(e.message).eql('Report not found');
                should(e.statusCode).eql(404);
            }
        });
    });

    describe('Get reports', function () {
        it('Database connector returns an array with reports', async () => {
            databaseGetReportsStub.resolves([REPORT, REPORT]);
            const reports = await manager.getReports();
            reports.length.should.eql(2);
        });

        it('Database returns an empty array', async () => {
            databaseGetReportsStub.resolves([]);
            const reports = await manager.getReports();
            should.exist(reports);
            reports.length.should.eql(0);
        });
    });

    describe('Get last reports', function () {
        it('Database connector returns an array with reports', async () => {
            databaseGetLastReportsStub.resolves([REPORT, REPORT]);
            const reports = await manager.getLastReports();
            reports.length.should.eql(2);
        });

        it('Database returns an empty array', async () => {
            databaseGetLastReportsStub.resolves([]);
            const reports = await manager.getLastReports();
            should.exist(reports);
            reports.length.should.eql(0);
        });
    });

    describe('Create new report', function () {
        it('Successfully insert report', async () => {
            getJobStub.resolves(JOB);
            databasePostReportStub.resolves();
            databaseSubscribeRunnerStub.resolves();
            const reportBody = await manager.postReport('test_id', REPORT);
            should.exist(reportBody);
        });

        it('Fail to retrieve job', async () => {
            const expectedError = new Error('Fail to retrieve job');
            getJobStub.rejects(expectedError);
            databasePostReportStub.resolves(REPORT);
            databaseSubscribeRunnerStub.resolves();
            try {
                const reportBody = await manager.postReport('test_id', REPORT);
                should.not.exist(reportBody);
            } catch (error) {
                error.should.eql(expectedError);
            }
        });
    });

    describe('Create new stats', function () {
        it('Stats consumer handles message', async () => {
            configStub.resolves({});
            reportManagerUpdateReportStub = sandbox.stub(reportsManager, 'updateReport');
            databaseGetReportStub.resolves([REPORT]);
            databasePostStatsStub.resolves();
            reportManagerUpdateReportStub.resolves();
            getJobStub.resolves(JOB);
            databaseUpdateSubscribersStub.resolves();
            const stats = { phase_status: 'intermediate', data: JSON.stringify({ median: 4 }) };
            const statsResponse = await manager.postStats('test_id', 'report_id', stats);
            should.exist(statsResponse);
            statsResponse.should.eql(stats);
            reportManagerUpdateReportStub.restore();
        });
    });

    describe('Update report status', function () {
        describe('Update report without parallelism', function () {
            it('Should update report successfully to started', async function () {
                REPORT.status = constants.REPORT_INITIALIZING_STATUS;
                REPORT.subscribers[0].stage = constants.SUBSCRIBER_STARTED_STAGE;
                const data = JSON.stringify({ arrival_rate: '5', duration: '5' });
                databaseUpdateReportStub.resolves();
                await reportsManager.updateReport(REPORT, constants.REPORT_STARTED_STATUS, { phase_status: constants.SUBSCRIBER_STARTED_STAGE, data });
                should(databaseUpdateReportStub.args[0]).containDeepOrdered(['test_id', 'report_id', constants.REPORT_STARTED_STATUS]);
            });

            it('Should update report successfully to in progress', async function () {
                REPORT.subscribers[0].stage = constants.SUBSCRIBER_INTERMEDIATE_STAGE;
                const data = REPORT.last_stats;
                databaseUpdateReportStub.resolves();
                await reportsManager.updateReport(REPORT, constants.REPORT_IN_PROGRESS_STATUS, { phase_status: constants.SUBSCRIBER_INTERMEDIATE_STAGE, data });
                should(databaseUpdateReportStub.args[0]).containDeepOrdered(['test_id', 'report_id', constants.REPORT_IN_PROGRESS_STATUS]);
            });

            it('Should update report successfully to finished', async function () {
                REPORT.subscribers[0].stage = constants.SUBSCRIBER_DONE_STAGE;
                const data = REPORT.last_stats;
                databaseUpdateReportStub.resolves();
                await reportsManager.updateReport(REPORT, constants.REPORT_FINISHED_STATUS, { phase_status: constants.SUBSCRIBER_DONE_STAGE, data });
                should(databaseUpdateReportStub.args[0]).containDeepOrdered(['test_id', 'report_id', constants.REPORT_FINISHED_STATUS]);
            });

            it('Should update report successfully to aborted', async function () {
                REPORT.subscribers[0].stage = constants.SUBSCRIBER_ABORTED_STAGE;
                const data = JSON.stringify({ arrival_rate: '5', duration: '5' });
                databaseUpdateReportStub.resolves();
                await reportsManager.updateReport(REPORT, constants.REPORT_ABORTED_STATUS, { phase_status: constants.SUBSCRIBER_ABORTED_STAGE, data });
                should(databaseUpdateReportStub.args[0]).containDeepOrdered(['test_id', 'report_id', constants.REPORT_ABORTED_STATUS]);
            });

            it('Should update report successfully to failed', async function () {
                REPORT.subscribers[0].stage = constants.SUBSCRIBER_FAILED_STAGE;
                const error = new Error('error');
                const data = JSON.stringify({ message: error.message });
                databaseUpdateReportStub.resolves();
                await reportsManager.updateReport(REPORT, constants.REPORT_FAILED_STATUS, { phase_status: constants.SUBSCRIBER_FAILED_STAGE, data });
                should(databaseUpdateReportStub.args[0]).containDeepOrdered(['test_id', 'report_id', constants.REPORT_FAILED_STATUS]);
            });
        });

        describe('Update report with parallelism - no delayed update', async () => {
            before(() => {
                REPORT.subscribers = [
                    { runner_id: '1234', stage: constants.SUBSCRIBER_STARTED_STAGE },
                    { runner_id: '5678', stage: constants.SUBSCRIBER_STARTED_STAGE }
                ];
            });

            it('Should update report successfully to started', async function () {
                REPORT.subscribers[0].stage = constants.SUBSCRIBER_STARTED_STAGE;
                const data = JSON.stringify({ arrival_rate: '5', duration: '5' });
                databaseUpdateReportStub.resolves();
                await reportsManager.updateReport(REPORT, constants.REPORT_STARTED_STATUS, { phase_status: constants.SUBSCRIBER_STARTED_STAGE, data });
                should(databaseUpdateReportStub.args[0]).containDeepOrdered(['test_id', 'report_id', constants.REPORT_STARTED_STATUS]);
            });

            it('Should update report successfully to in progress', async function () {
                REPORT.subscribers[0].stage = constants.SUBSCRIBER_INTERMEDIATE_STAGE;
                const data = REPORT.last_stats;
                databaseUpdateReportStub.resolves();
                await reportsManager.updateReport(REPORT, constants.REPORT_IN_PROGRESS_STATUS, {
                    phase_status: constants.SUBSCRIBER_INTERMEDIATE_STAGE,
                    data
                });
                should(databaseUpdateReportStub.args[0]).containDeepOrdered(['test_id', 'report_id', constants.REPORT_IN_PROGRESS_STATUS]);
            });

            it('Should update report successfully to finished', async function () {
                REPORT.subscribers[0].stage = constants.SUBSCRIBER_DONE_STAGE;
                REPORT.subscribers[1].stage = constants.SUBSCRIBER_DONE_STAGE;
                const data = REPORT.last_stats;
                databaseUpdateReportStub.resolves();
                await reportsManager.updateReport(REPORT, constants.REPORT_FINISHED_STATUS, {
                    phase_status: constants.SUBSCRIBER_DONE_STAGE,
                    data
                });
                should(databaseUpdateReportStub.args[0]).containDeepOrdered(['test_id', 'report_id', constants.REPORT_FINISHED_STATUS]);
            });

            it('Should update report successfully to aborted', async function () {
                REPORT.subscribers[0].stage = constants.SUBSCRIBER_ABORTED_STAGE;
                REPORT.subscribers[1].stage = constants.SUBSCRIBER_ABORTED_STAGE;
                const data = JSON.stringify({ arrival_rate: '5', duration: '5' });
                databaseUpdateReportStub.resolves();
                await reportsManager.updateReport(REPORT, constants.REPORT_ABORTED_STATUS, {
                    phase_status: constants.SUBSCRIBER_ABORTED_STAGE,
                    data
                });
                should(databaseUpdateReportStub.args[0]).containDeepOrdered(['test_id', 'report_id', constants.REPORT_ABORTED_STATUS]);
            });

            it('Should update report successfully to failed', async function () {
                REPORT.subscribers[0].stage = constants.SUBSCRIBER_FAILED_STAGE;
                REPORT.subscribers[1].stage = constants.SUBSCRIBER_FAILED_STAGE;
                const error = new Error('error');
                const data = JSON.stringify({ message: error.message });
                databaseUpdateReportStub.resolves();
                await reportsManager.updateReport(REPORT, constants.REPORT_FAILED_STATUS, {
                    phase_status: constants.SUBSCRIBER_FAILED_STAGE,
                    data
                });
                should(databaseUpdateReportStub.args[0]).containDeepOrdered(['test_id', 'report_id', constants.REPORT_FAILED_STATUS]);
            });

            it('Should update report successfully to partially finished (one runner failed and one finished)', async function () {
                REPORT.subscribers[0].stage = constants.SUBSCRIBER_DONE_STAGE;
                REPORT.subscribers[1].stage = constants.SUBSCRIBER_FAILED_STAGE;
                databaseGetReportStub.resolves([REPORT]);
                const error = new Error('error');
                const data = JSON.stringify({ message: error.message });
                databaseUpdateReportStub.resolves();
                await reportsManager.updateReport(REPORT, constants.REPORT_FINISHED_STATUS, {
                    phase_status: constants.SUBSCRIBER_DONE_STAGE,
                    data
                });
                should(databaseUpdateReportStub.args[0]).containDeepOrdered(['test_id', 'report_id', constants.REPORT_PARTIALLY_FINISHED_STATUS]);
            });

            it('Should update report successfully to partially finished (one runner aborted and one finished)', async function () {
                REPORT.subscribers[0].stage = constants.SUBSCRIBER_DONE_STAGE;
                REPORT.subscribers[1].stage = constants.SUBSCRIBER_ABORTED_STAGE;
                databaseGetReportStub.resolves([REPORT]);
                const error = new Error('error');
                const data = JSON.stringify({ message: error.message });
                databaseUpdateReportStub.resolves();
                await reportsManager.updateReport(REPORT, constants.REPORT_FINISHED_STATUS, {
                    phase_status: constants.SUBSCRIBER_DONE_STAGE,
                    data
                });
                should(databaseUpdateReportStub.args[0]).containDeepOrdered(['test_id', 'report_id', constants.REPORT_PARTIALLY_FINISHED_STATUS]);
            });
        });

        describe('Update report with parallelism - delayed update', async () => {
            const checkDelayedUpdate = (statusToCheck) => {
                return new Promise((resolve, reject) => {
                    setTimeout(() => {
                        should(databaseUpdateReportStub.args[0]).containDeepOrdered(['test_id', 'report_id', statusToCheck]);
                        resolve();
                    }, 1500);
                });
            };

            before(() => {
                REPORT.subscribers = [
                    { runner_id: '1234', stage: constants.SUBSCRIBER_STARTED_STAGE },
                    { runner_id: '5678', stage: constants.SUBSCRIBER_STARTED_STAGE }
                ];
                reportsManager.__set__('MINIMUM_WAIT_FOR_DELAYED_REPORT_UPDATE_MS', 1000);
            });

            it('Should update report successfully to finished', async function () {
                REPORT.subscribers[0].stage = constants.SUBSCRIBER_DONE_STAGE;
                REPORT.subscribers[1].stage = constants.SUBSCRIBER_INTERMEDIATE_STAGE;
                databaseUpdateReportStub.resolves();
                const data = REPORT.last_stats;
                await reportsManager.updateReport(REPORT, constants.REPORT_FINISHED_STATUS, {
                    phase_status: constants.SUBSCRIBER_DONE_STAGE,
                    data
                });

                REPORT.subscribers[1].stage = constants.SUBSCRIBER_DONE_STAGE;
                databaseGetReportStub.resolves([REPORT]);

                await checkDelayedUpdate(constants.REPORT_FINISHED_STATUS);
            });

            it('Should update report successfully to partially finished (one runner in started and one finished)', async function () {
                REPORT.subscribers[0].stage = constants.SUBSCRIBER_DONE_STAGE;
                REPORT.subscribers[1].stage = constants.SUBSCRIBER_STARTED_STAGE;
                databaseGetReportStub.resolves([REPORT]);
                databaseUpdateReportStub.resolves();
                const error = new Error('error');
                const data = JSON.stringify({ message: error.message });
                await reportsManager.updateReport(REPORT, constants.REPORT_FINISHED_STATUS, {
                    phase_status: constants.SUBSCRIBER_DONE_STAGE,
                    data
                });
                await checkDelayedUpdate(constants.REPORT_PARTIALLY_FINISHED_STATUS);
            });

            it('Should update report successfully to partially finished (one runner in progress and one finished)', async function () {
                REPORT.subscribers[0].stage = constants.SUBSCRIBER_DONE_STAGE;
                REPORT.subscribers[1].stage = constants.SUBSCRIBER_INTERMEDIATE_STAGE;
                databaseGetReportStub.resolves([REPORT]);
                const error = new Error('error');
                const data = JSON.stringify({ message: error.message });
                databaseUpdateReportStub.resolves();
                await reportsManager.updateReport(REPORT, constants.REPORT_FINISHED_STATUS, {
                    phase_status: constants.SUBSCRIBER_DONE_STAGE,
                    data
                });
                await checkDelayedUpdate(constants.REPORT_PARTIALLY_FINISHED_STATUS);
            });

            it('Should update report successfully to partially finished (one runner failed and one finished)', async function () {
                REPORT.subscribers[0].stage = constants.SUBSCRIBER_DONE_STAGE;
                REPORT.subscribers[1].stage = constants.SUBSCRIBER_INTERMEDIATE_STAGE;
                const error = new Error('error');
                const data = JSON.stringify({ message: error.message });
                databaseUpdateReportStub.resolves();
                await reportsManager.updateReport(REPORT, constants.REPORT_FINISHED_STATUS, {
                    phase_status: constants.SUBSCRIBER_DONE_STAGE,
                    data
                });

                REPORT.subscribers[1].stage = constants.SUBSCRIBER_FAILED_STAGE;
                databaseGetReportStub.resolves([REPORT]);

                await checkDelayedUpdate(constants.REPORT_PARTIALLY_FINISHED_STATUS);
            });

            it('Should update report successfully to partially finished (one runner aborted and one finished)', async function () {
                REPORT.subscribers[0].stage = constants.SUBSCRIBER_DONE_STAGE;
                REPORT.subscribers[1].stage = constants.SUBSCRIBER_INTERMEDIATE_STAGE;
                const error = new Error('error');
                const data = JSON.stringify({ message: error.message });
                databaseUpdateReportStub.resolves();
                await reportsManager.updateReport(REPORT, constants.REPORT_FINISHED_STATUS, {
                    phase_status: constants.SUBSCRIBER_DONE_STAGE,
                    data
                });

                REPORT.subscribers[1].stage = constants.SUBSCRIBER_ABORTED_STAGE;
                databaseGetReportStub.resolves([REPORT]);

                await checkDelayedUpdate(constants.REPORT_PARTIALLY_FINISHED_STATUS);
            });
        });
    });
});