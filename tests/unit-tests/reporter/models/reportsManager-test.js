'use strict';
process.env.JOB_PLATFORM = 'KUBERNETES';
const should = require('should');
const rewire = require('rewire');
const sinon = require('sinon');

const databaseConnector = require('../../../../src/reports/models/databaseConnector');
const testManager = require('../../../../src/tests/models/manager');
const aggregateReportManager = require('../../../../src/reports/models/aggregateReportManager');
const benchmarkCalculator = require('../../../../src/reports/models/benchmarkCalculator');
const jobsManager = require('../../../../src/jobs/models/jobManager');
const logger = require('../../../../src/common/logger');
const notifier = require('../../../../src/reports/models/notifier');
const constants = require('../../../../src/reports/utils/constants');
const configHandler = require('../../../../src/configManager/models/configHandler');

let manager;
let statsManager;

const REPORT = {
    'test_id': 'test_id',
    'revision_id': 'revision_id',
    'report_id': 'report_id',
    'test_name': 'test name',
    'report_url': 'http://www.zooz.com',
    'status': constants.REPORT_INITIALIZING_STATUS,
    'start_time': 1527533459591,
    'grafana_report': 'http://www.grafana.com&var-Name=test%20name&from=1527533459591&to=1527533519591',
    'subscribers': [
        {
            'runner_id': '1234',
            'phase_status': constants.SUBSCRIBER_STARTED_STAGE,
            'last_stats': { rps: { mean: 500 }, codes: { '200': 10 } }
        }
    ],
    'test_configuration': JSON.stringify({
        duration: 10
    }),
    last_updated_at: Date.now()
};

const REPORT_DONE = {
    'test_id': 'test_id',
    'revision_id': 'revision_id',
    'report_id': 'report_id',
    'test_name': 'test name',
    'report_url': 'http://www.zooz.com',
    'status': constants.REPORT_INITIALIZING_STATUS,
    'start_time': 1527533459591,
    'grafana_report': 'http://www.grafana.com&var-Name=test%20name&from=1527533459591&to=1527533519591',
    'subscribers': [
        {
            'runner_id': '1234',
            'phase_status': constants.SUBSCRIBER_DONE_STAGE,
            'last_stats': { rps: { mean: 500 }, codes: { '200': 10 } }
        }
    ],
    'test_configuration': JSON.stringify({
        duration: 10
    }),
    last_updated_at: Date.now()
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
    let databaseUpdateSubscriberStub;
    let databaseUpdateSubscriberWithStatsStub;
    let databaseUpdateReportStub;
    let databaseDeleteReportStub;
    let getJobStub;
    let configStub;
    let notifierStub;
    let getBenchmarkStub;
    let aggregateReportManagerStub;
    let benchmarkCalculatorStub;
    let updateReportBenchmarkStub;

    before(() => {
        sandbox = sinon.sandbox.create();

        databaseGetReportStub = sandbox.stub(databaseConnector, 'getReport');
        databaseGetReportsStub = sandbox.stub(databaseConnector, 'getReports');
        databaseGetLastReportsStub = sandbox.stub(databaseConnector, 'getLastReports');
        databasePostReportStub = sandbox.stub(databaseConnector, 'insertReport');
        databasePostStatsStub = sandbox.stub(databaseConnector, 'insertStats');
        databaseSubscribeRunnerStub = sandbox.stub(databaseConnector, 'subscribeRunner');
        databaseUpdateSubscriberStub = sandbox.stub(databaseConnector, 'updateSubscriber');
        databaseUpdateSubscriberWithStatsStub = sandbox.stub(databaseConnector, 'updateSubscriberWithStats');
        getBenchmarkStub = sandbox.stub(testManager, 'getBenchmark');
        aggregateReportManagerStub = sandbox.stub(aggregateReportManager, 'aggregateReport');
        benchmarkCalculatorStub = sandbox.stub(benchmarkCalculator, 'calculate');
        updateReportBenchmarkStub = sandbox.stub(databaseConnector, 'updateReportBenchmark');
        databaseUpdateReportStub = sandbox.stub(databaseConnector, 'updateReport');
        databaseDeleteReportStub = sandbox.stub(databaseConnector, 'deleteReport');
        loggerErrorStub = sandbox.stub(logger, 'error');
        loggerInfoStub = sandbox.stub(logger, 'info');
        getJobStub = sandbox.stub(jobsManager, 'getJob');
        configStub = sandbox.stub(configHandler, 'getConfig');
        notifierStub = sandbox.stub(notifier, 'notifyIfNeeded');

        manager = rewire('../../../../src/reports/models/reportsManager');
        statsManager = rewire('../../../../src/reports/models/statsManager');
        manager.__set__('configHandler', {
            getConfig: () => {
                return {
                    job_platform: 'KUBERNETES'
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
            should.exist(report.grafana_report);
            should(report.grafana_report).eql('http://www.grafana.com&var-Name=test%20name&from=1527533459591&to=now');
        });

        it('Database connector returns an array with one report and score ', async () => {
            manager.__set__('configHandler', {
                getConfig: () => {
                    return { grafana_url: 'http://www.grafana.com' };
                }
            });
            const reportWithScore = Object.assign({ score: 6.6, benchmark_weights_data: JSON.stringify({ data: 'some data' }) }, REPORT);
            databaseGetReportStub.resolves([reportWithScore]);
            const report = await manager.getReport();
            should.exist(report);
            should.exist(report.grafana_report);
            should.exist(report.benchmark_weights_data);
            should(report.score).eql(6.6);
            should(report.benchmark_weights_data).eql({ data: 'some data' });
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

    describe('Report status', function () {
        describe('No parallelism', function () {
            let testReport;
            before(() => {
                testReport = Object.assign({}, REPORT);
                should(testReport.subscribers.length).eql(1);
            });

            it('Report should be started', async () => {
                testReport.subscribers[0].phase_status = constants.SUBSCRIBER_STARTED_STAGE;
                databaseGetReportStub.resolves([testReport]);
                const report = await manager.getReport();
                should(report.status).eql(constants.REPORT_STARTED_STATUS);
                should.not.exist(report.end_time);
            });
            it('Report should be in progress', async () => {
                testReport.subscribers[0].phase_status = constants.SUBSCRIBER_FIRST_INTERMEDIATE_STAGE;
                databaseGetReportStub.resolves([testReport]);
                const report = await manager.getReport();
                should(report.status).eql(constants.REPORT_IN_PROGRESS_STATUS);
                should.not.exist(report.end_time);
            });
            it('Report should be in progress', async () => {
                testReport.subscribers[0].phase_status = constants.SUBSCRIBER_INTERMEDIATE_STAGE;
                databaseGetReportStub.resolves([testReport]);
                const report = await manager.getReport();
                should(report.status).eql(constants.REPORT_IN_PROGRESS_STATUS);
                should.not.exist(report.end_time);
            });
            it('Report should be finished', async () => {
                testReport.subscribers[0].phase_status = constants.SUBSCRIBER_DONE_STAGE;
                databaseGetReportStub.resolves([testReport]);
                const report = await manager.getReport();
                should(report.status).eql(constants.REPORT_FINISHED_STATUS);
                should.exist(report.end_time);
            });
            it('Report should be aborted', async () => {
                testReport.subscribers[0].phase_status = constants.SUBSCRIBER_ABORTED_STAGE;
                databaseGetReportStub.resolves([testReport]);
                const report = await manager.getReport();
                should(report.status).eql(constants.REPORT_ABORTED_STATUS);
                should.exist(report.end_time);
            });
            it('Report should be failed', async () => {
                testReport.subscribers[0].phase_status = constants.SUBSCRIBER_FAILED_STAGE;
                databaseGetReportStub.resolves([testReport]);
                const report = await manager.getReport();
                should(report.status).eql(constants.REPORT_FAILED_STATUS);
                should.exist(report.end_time);
            });
        });
        describe('With parallelism', function () {
            let testReport;
            before(() => {
                testReport = Object.assign({}, REPORT);
                let secondSubscriber = Object.assign({}, testReport.subscribers[0]);
                testReport.subscribers.push(secondSubscriber);
                should(testReport.subscribers.length).eql(2);
            });

            it('Report should be started', async () => {
                testReport.subscribers[0].phase_status = constants.SUBSCRIBER_STARTED_STAGE;
                databaseGetReportStub.resolves([testReport]);
                const report = await manager.getReport();
                should(report.status).eql(constants.REPORT_STARTED_STATUS);
                should.not.exist(report.end_time);
            });
            it('Report should be in progress', async () => {
                testReport.subscribers[0].phase_status = constants.SUBSCRIBER_FIRST_INTERMEDIATE_STAGE;
                databaseGetReportStub.resolves([testReport]);
                const report = await manager.getReport();
                should(report.status).eql(constants.REPORT_IN_PROGRESS_STATUS);
                should.not.exist(report.end_time);
            });
            it('Report should be in progress', async () => {
                testReport.subscribers[0].phase_status = constants.SUBSCRIBER_INTERMEDIATE_STAGE;
                databaseGetReportStub.resolves([testReport]);
                const report = await manager.getReport();
                should(report.status).eql(constants.REPORT_IN_PROGRESS_STATUS);
                should.not.exist(report.end_time);
            });
            it('Report should be finished', async () => {
                testReport.subscribers[0].phase_status = constants.SUBSCRIBER_DONE_STAGE;
                testReport.subscribers[1].phase_status = constants.SUBSCRIBER_DONE_STAGE;
                databaseGetReportStub.resolves([testReport]);
                const report = await manager.getReport();
                should(report.status).eql(constants.REPORT_FINISHED_STATUS);
                should.exist(report.end_time);
            });
            it('Report should be aborted', async () => {
                testReport.subscribers[0].phase_status = constants.SUBSCRIBER_ABORTED_STAGE;
                testReport.subscribers[1].phase_status = constants.SUBSCRIBER_ABORTED_STAGE;
                databaseGetReportStub.resolves([testReport]);
                const report = await manager.getReport();
                should(report.status).eql(constants.REPORT_ABORTED_STATUS);
                should.exist(report.end_time);
            });
            it('Report should be failed', async () => {
                testReport.subscribers[0].phase_status = constants.SUBSCRIBER_FAILED_STAGE;
                testReport.subscribers[1].phase_status = constants.SUBSCRIBER_FAILED_STAGE;
                databaseGetReportStub.resolves([testReport]);
                const report = await manager.getReport();
                should(report.status).eql(constants.REPORT_FAILED_STATUS);
                should.exist(report.end_time);
            });

            [constants.SUBSCRIBER_FAILED_STAGE, constants.SUBSCRIBER_ABORTED_STAGE,
                constants.SUBSCRIBER_FIRST_INTERMEDIATE_STAGE, constants.SUBSCRIBER_INTERMEDIATE_STAGE,
                constants.SUBSCRIBER_INITIALIZING_STAGE, constants.SUBSCRIBER_STARTED_STAGE]
                .forEach((unfinishedSubscriberStage) => {
                    it('Report should be partially finished with unfinished subscriber stage: ' + unfinishedSubscriberStage, async () => {
                        testReport.subscribers[0].phase_status = unfinishedSubscriberStage;
                        testReport.subscribers[1].phase_status = constants.SUBSCRIBER_DONE_STAGE;
                        databaseGetReportStub.resolves([testReport]);
                        const report = await manager.getReport();
                        should(report.status).eql(constants.REPORT_PARTIALLY_FINISHED_STATUS);
                        should.exist(report.end_time);
                    });
                });

            [constants.SUBSCRIBER_FAILED_STAGE, constants.SUBSCRIBER_ABORTED_STAGE,
                constants.SUBSCRIBER_FIRST_INTERMEDIATE_STAGE, constants.SUBSCRIBER_INTERMEDIATE_STAGE,
                constants.SUBSCRIBER_INITIALIZING_STAGE, constants.SUBSCRIBER_STARTED_STAGE]
                .forEach((unfinishedSubscriberStage) => {
                    it('DELAYED - Report should be partially finished with one unfinished subscriber stage: ' + unfinishedSubscriberStage, (done) => {
                        manager.__set__('configHandler', {
                            getConfig: () => {
                                return { minimum_wait_for_delayed_report_status_update_in_ms: 10 };
                            }
                        });
                        setTimeout(async () => {
                            testReport.subscribers[0].phase_status = unfinishedSubscriberStage;
                            testReport.subscribers[1].phase_status = constants.SUBSCRIBER_DONE_STAGE;
                            databaseGetReportStub.resolves([testReport]);
                            const report = await manager.getReport();
                            should(report.status).eql(constants.REPORT_PARTIALLY_FINISHED_STATUS);
                            should.exist(report.end_time);
                            done();
                        }, 100);
                    });
                });

            it('DELAYED - Report should be failed - no subscribers finished', function (done) {
                manager.__set__('configHandler', {
                    getConfig: () => {
                        return { minimum_wait_for_delayed_report_status_update_in_ms: 10 };
                    }
                });
                setTimeout(async () => {
                    testReport.subscribers[0].phase_status = constants.SUBSCRIBER_STARTED_STAGE;
                    testReport.subscribers[1].phase_status = constants.SUBSCRIBER_INTERMEDIATE_STAGE;
                    databaseGetReportStub.resolves([testReport]);
                    const report = await manager.getReport();
                    should(report.status).eql(constants.REPORT_FAILED_STATUS);
                    should.exist(report.end_time);
                    done();
                }, 100);
            });
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

        it('get last report with avg rsp when test running', async () => {
            const now = new Date();
            const tenSecBefore = new Date(now).setSeconds(now.getSeconds() - 10);
            const subscriber = { last_stats: { rps: { total_count: 200 }, codes: { '200': 10 } } };
            const report = Object.assign({}, REPORT, { last_updated_at: now, start_time: tenSecBefore, subscribers: [subscriber] });
            databaseGetLastReportsStub.resolves([report]);
            const reports = await manager.getLastReports();
            reports.length.should.eql(1);
            should(reports[0].avg_rps).eql(20);
        });
        it('get last report with avg rsp when test finished', async () => {
            const now = new Date();
            const tenSecBefore = new Date(now).setSeconds(now.getSeconds() - 10);
            const subscriber = { last_stats: { rps: { total_count: 300 }, codes: { '200': 10 } } };
            const report = Object.assign({}, REPORT, {
                end_time: now,
                start_time: tenSecBefore,
                subscribers: [subscriber]
            });
            databaseGetLastReportsStub.resolves([report]);
            const reports = await manager.getLastReports();
            reports.length.should.eql(1);
            should(reports[0].avg_rps).eql(30);
        });
        it('get last report with avg rsp when total_count not exist ', async () => {
            const now = new Date();
            const tenSecBefore = new Date(now).setSeconds(now.getSeconds() - 10);
            const subscriber = { last_stats: { rps: { test: 'test' }, codes: { '200': 10 } } };
            const report = Object.assign({}, REPORT, {
                end_time: now,
                start_time: tenSecBefore,
                subscribers: [subscriber]
            });
            databaseGetLastReportsStub.resolves([report]);
            const reports = await manager.getLastReports();
            reports.length.should.eql(1);
            should(reports[0].avg_rps).eql(0);
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
    describe('edit report', function () {
        it('Successfully edit report', async () => {
            databaseGetReportStub.resolves(['report']);
            databaseUpdateReportStub.resolves();
            await manager.editReport('test_id', REPORT, { notes: 'notes' });
        });
    });

    describe('delete report', function () {
        [constants.SUBSCRIBER_DONE_STAGE, constants.SUBSCRIBER_ABORTED_STAGE, constants.SUBSCRIBER_FAILED_STAGE]
            .forEach(subscriberStatus => {
                it(`Successfully delete report with subscriber status ${subscriberStatus}`, async () => {
                    const finishedReport = JSON.parse(JSON.stringify(REPORT));
                    finishedReport.subscribers[0].phase_status = subscriberStatus;
                    databaseGetReportStub.resolves([finishedReport]);
                    await manager.deleteReport('test_id', 'report_id');
                });
            });

        [constants.SUBSCRIBER_INITIALIZING_STAGE, constants.SUBSCRIBER_STARTED_STAGE, constants.SUBSCRIBER_INTERMEDIATE_STAGE, constants.SUBSCRIBER_FIRST_INTERMEDIATE_STAGE]
            .forEach(subscriberStatus => {
                it(`Failure delete in-progress report with subscriber status ${subscriberStatus}`, async () => {
                    const inProgressReport = JSON.parse(JSON.stringify(REPORT));
                    inProgressReport.subscribers[0].phase_status = subscriberStatus;
                    databaseGetReportStub.resolves([inProgressReport]);

                    try {
                        await manager.deleteReport('test_id', 'report_id');
                        throw new Error('should not get here');
                    } catch (error) {
                        should.exist(error);
                        should(error.message).startWith('Can\'t delete running test with status');
                        should(error.statusCode).eql(400);
                    }
                });
            });

        it('Failure delete test due to db error on delete report', async () => {
            const finishedReport = JSON.parse(JSON.stringify(REPORT));
            finishedReport.subscribers[0].phase_status = constants.SUBSCRIBER_ABORTED_STAGE;
            databaseGetReportStub.resolves([finishedReport]);
            databaseDeleteReportStub.rejects(new Error('DB Error'));
            try {
                await manager.deleteReport('test_id', 'report_id');
                throw new Error('should not get here');
            } catch (error) {
                should.exist(error);
                should(error.message).eql('DB Error');
            }
        });

        it('Failure delete test due to db error on get report', async () => {
            databaseGetReportStub.rejects(new Error('DB Error'));
            try {
                await manager.deleteReport('test_id', 'report_id');
                throw new Error('should not get here');
            } catch (error) {
                should.exist(error);
                should(error.message).eql('DB Error');
            }
        });
    });

    describe('Create new stats', function () {
        before(() => {
            statsManager.__set__('configHandler', {
                getConfig: () => {
                    return {
                        job_platform: 'KUBERNETES',
                        benchmark_weights: { config: 'some value' },
                        benchmark_threshold: 99
                    };
                }
            });
        });
        it('Stats consumer handles message with status intermediate', async () => {
            configStub.resolves({});
            databaseGetReportStub.resolves([REPORT]);
            databasePostStatsStub.resolves();
            getJobStub.resolves(JOB);
            notifierStub.resolves();
            const stats = { phase_status: 'intermediate', data: JSON.stringify({ median: 4 }), runner_id: 123 };

            const statsResponse = await statsManager.postStats({ subscribers: [{ runner_id: 123 }] }, stats);

            databaseUpdateSubscriberStub.callCount.should.eql(0);
            databaseUpdateSubscriberWithStatsStub.callCount.should.eql(1);

            should.exist(statsResponse);
            statsResponse.should.eql(stats);
        });

        it('Stats intermediate and verify update subscriber with total_count in first time', async () => {
            configStub.resolves({});
            databaseGetReportStub.resolves([REPORT]);
            databasePostStatsStub.resolves();
            getJobStub.resolves(JOB);
            notifierStub.resolves();
            const stats = {
                phase_status: 'intermediate',
                data: JSON.stringify({ rps: { count: 10 } }),
                runner_id: 123
            };
            const statsResponse = await statsManager.postStats({ subscribers: [{ runner_id: 123, last_stats: {} }] }, stats);

            databaseUpdateSubscriberStub.callCount.should.eql(0);
            databaseUpdateSubscriberWithStatsStub.callCount.should.eql(1);
            const data = JSON.parse(databaseUpdateSubscriberWithStatsStub.args[0][4]);
            should(data.rps.total_count).eql(10);
            should.exist(statsResponse);
            statsResponse.should.eql(stats);
        });
        it('Stats intermediate and verify update subscriber second time with total_count', async () => {
            configStub.resolves({});
            databaseGetReportStub.resolves([REPORT]);
            databasePostStatsStub.resolves();
            getJobStub.resolves(JOB);
            notifierStub.resolves();
            const stats = {
                phase_status: 'intermediate',
                data: JSON.stringify({ rps: { count: 10 } }),
                runner_id: 123
            };
            const statsResponse = await statsManager.postStats({
                subscribers: [{
                    runner_id: 123,
                    last_stats: { rps: { total_count: 18 } }
                }]
            }, stats);

            databaseUpdateSubscriberStub.callCount.should.eql(0);
            databaseUpdateSubscriberWithStatsStub.callCount.should.eql(1);
            const data = JSON.parse(databaseUpdateSubscriberWithStatsStub.args[0][4]);
            should(data.rps.total_count).eql(28);
            should.exist(statsResponse);
            statsResponse.should.eql(stats);
        });

        it('Stats consumer handles message with status done', async () => {
            configStub.resolves({});
            databaseGetReportStub.resolves([REPORT]);
            databasePostStatsStub.resolves();
            getJobStub.resolves(JOB);
            notifierStub.resolves();
            const stats = { phase_status: 'done', data: JSON.stringify({ median: 4 }) };

            const statsResponse = await statsManager.postStats('test_id', stats);

            databaseUpdateSubscriberStub.callCount.should.eql(1);
            databaseUpdateSubscriberWithStatsStub.callCount.should.eql(0);

            should.exist(statsResponse);
            statsResponse.should.eql(stats);
        });
        it('Stats consumer handles message with status aborted', async () => {
            configStub.resolves({});
            databaseGetReportStub.resolves([REPORT]);
            databasePostStatsStub.resolves();
            getJobStub.resolves(JOB);
            notifierStub.resolves();
            const stats = { phase_status: 'aborted', data: JSON.stringify({ median: 4 }) };

            const statsResponse = await statsManager.postStats('test_id', stats);

            databaseUpdateSubscriberStub.callCount.should.eql(1);
            databaseUpdateSubscriberWithStatsStub.callCount.should.eql(0);

            should.exist(statsResponse);
            statsResponse.should.eql(stats);
        });

        it('when report done and have benchmark data ', async () => {
            databaseGetReportStub.resolves([REPORT_DONE]);
            getBenchmarkStub.resolves({ test: 'some  benchmark data' });
            aggregateReportManagerStub.resolves({ aggregate: { test: 'some aggregate data' } });
            benchmarkCalculatorStub.returns({ score: 5.5, data: { test: 'some calculate data' } });
            updateReportBenchmarkStub.resolves();
            const stats = { phase_status: 'done', data: JSON.stringify({ median: 1 }) };
            await statsManager.postStats('test_id', stats);

            getBenchmarkStub.callCount.should.eql(1);
            aggregateReportManagerStub.callCount.should.eql(1);
            benchmarkCalculatorStub.callCount.should.eql(1);
            updateReportBenchmarkStub.callCount.should.eql(1);

            should(getBenchmarkStub.args).eql([['test_id']]);
            should(benchmarkCalculatorStub.args).eql([[{ 'test': 'some  benchmark data' }, { 'test': 'some aggregate data' }, {
                config: 'some value'
            }]]);
            should(updateReportBenchmarkStub.args[0][0]).eql('test_id');
            should(updateReportBenchmarkStub.args[0][1]).eql('report_id');
            should(updateReportBenchmarkStub.args[0][2]).eql(5.5);
            should(updateReportBenchmarkStub.args[0][3]).eql(JSON.stringify({ test: 'some calculate data', 'benchmark_threshold': 99 }));
        });
        it('when report done and dont have benchmark data ', async () => {
            databaseGetReportStub.resolves([REPORT_DONE]);
            getBenchmarkStub.resolves();
            const stats = { phase_status: 'done', data: JSON.stringify({ median: 1 }) };
            await statsManager.postStats('test_id', stats);

            getBenchmarkStub.callCount.should.eql(1);
            aggregateReportManagerStub.callCount.should.eql(0);
            benchmarkCalculatorStub.callCount.should.eql(0);
            updateReportBenchmarkStub.callCount.should.eql(0);

            should(getBenchmarkStub.args).eql([['test_id']]);
        });
    });
});
