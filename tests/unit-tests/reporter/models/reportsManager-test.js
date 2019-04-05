'use strict';
process.env.JOB_PLATFORM = 'KUBERNETES';
const should = require('should');
const rewire = require('rewire');
const sinon = require('sinon');

const databaseConnector = require('../../../../src/reports/models/databaseConnector');
const jobsManager = require('../../../../src/jobs/models/jobManager');
const logger = require('../../../../src/common/logger');
const notifier = require('../../../../src/reports/models/notifier');
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
    let getJobStub;
    let configStub;
    let notifierStub;

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
        notifierStub = sandbox.stub(notifier, 'notifyIfNeeded');

        manager = rewire('../../../../src/reports/models/reportsManager');
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
            should(report.grafana_report).eql('http://www.grafana.com&var-Name=test%20name&from=1527533459591');
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
            databaseGetReportStub.resolves([REPORT]);
            databasePostStatsStub.resolves();
            getJobStub.resolves(JOB);
            databaseUpdateSubscribersStub.resolves();
            notifierStub.resolves();
            const stats = { phase_status: 'intermediate', data: JSON.stringify({ median: 4 }) };

            const statsResponse = await manager.postStats('test_id', stats);
            should.exist(statsResponse);
            statsResponse.should.eql(stats);
        });
    });
});