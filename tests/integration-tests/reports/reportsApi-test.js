'use strict';

const should = require('should');
const uuid = require('uuid/v4');

const statsGenerator = require('./helpers/statsGenerator');
const reportsRequestCreator = require('./helpers/requestCreator');
const jobRequestCreator = require('../jobs/helpers/requestCreator');
const testsRequestCreator = require('../tests/helpers/requestCreator');
const constants = require('../../../src/reports/utils/constants');

const mailhogHelper = require('./mailhog/mailhogHelper');

let testId, reportId, jobId, runnerId, firstRunner, secondRunner, jobBody, minimalReportBody;

describe('Integration tests for the reports api', function() {
    this.timeout(10000);
    before(async () => {
        await reportsRequestCreator.init();
        await testsRequestCreator.init();
        await jobRequestCreator.init();

        let requestBody = require('../../testExamples/Basic_test');
        let response = await testsRequestCreator.createTest(requestBody, {});
        should(response.statusCode).eql(201);
        should(response.body).have.key('id');
        testId = response.body.id;
    });

    beforeEach(async function () {
        reportId = uuid();

        minimalReportBody = {
            test_type: 'basic',
            report_id: reportId,
            job_id: undefined,
            revision_id: uuid(),
            test_name: 'integration-test',
            test_description: 'doing some integration testing',
            start_time: Date.now().toString(),
            last_updated_at: Date.now().toString(),
            test_configuration: {
                enviornment: 'test',
                duration: 10,
                arrival_rate: 20
            }
        };
    });

    afterEach(async function () {
        await mailhogHelper.clearAllOldMails();
    });

    describe('Happy flow - no parallelism', function () {
        describe('Create report', function () {
            describe('Create report with minimal fields and notes', async function () {
                before(async () => {
                    if (!jobId) {
                        const jobResponse = await createJob(testId);
                        jobBody = jobResponse.body;
                        jobId = jobResponse.body.id;
                    }
                });

                it('should successfully create report', async function () {
                    let reportBody = minimalReportBody;

                    reportBody.job_id = jobId;
                    reportBody.runner_id = uuid();
                    const reportResponse = await reportsRequestCreator.createReport(testId, reportBody);
                    should(reportResponse.statusCode).be.eql(201);

                    let getReportResponse = await reportsRequestCreator.getReport(testId, reportId);
                    let report = getReportResponse.body;
                    should(report.status).eql('initializing');
                    should(report.notes).eql(jobBody.notes);
                    should(report.max_virtual_users).eql(jobBody.max_virtual_users);
                    should(report.arrival_rate).eql(jobBody.arrival_rate);
                    should(report.duration).eql(jobBody.duration);
                    should(report.ramp_to).eql(jobBody.ramp_to);
                });
            });

            describe('Create report with minimal fields and webhooks', async function () {
                before(async function () {
                    const jobResponse = await createJob(testId, undefined, ['https://webhook.to.here.com']);
                    jobId = jobResponse.body.id;
                });

                it('should successfully create report', async function () {
                    let reportBody = Object.assign({}, minimalReportBody);

                    reportBody.job_id = jobId;
                    reportBody.runner_id = uuid();
                    const reportResponse = await reportsRequestCreator.createReport(testId, reportBody);
                    should(reportResponse.statusCode).be.eql(201);

                    let getReportResponse = await reportsRequestCreator.getReport(testId, reportId);
                    let report = getReportResponse.body;

                    should(report.status).eql('initializing');
                    should(report.notes).eql(jobBody.notes);
                });
            });

            describe('Create report with minimal fields and emails', async function () {
                before(async function () {
                    const jobResponse = await createJob(testId, ['mickey@dog.com']);
                    jobId = jobResponse.body.id;
                });

                it('should successfully create report', async function () {
                    let reportBody = Object.assign({}, minimalReportBody);

                    reportBody.job_id = jobId;
                    reportBody.runner_id = uuid();
                    const reportResponse = await reportsRequestCreator.createReport(testId, reportBody);
                    should(reportResponse.statusCode).be.eql(201);

                    let getReportResponse = await reportsRequestCreator.getReport(testId, reportId);
                    let report = getReportResponse.body;

                    should(report.status).eql('initializing');
                    should(report.notes).eql(jobBody.notes);
                });
            });
        });

        describe('Create report, post stats, and get final report', function () {
            describe('Create report with all fields, and post full cycle stats', async function () {
                before(async function () {
                    const jobResponse = await createJob(testId, ['mickey@dog.com'], ['https://webhook.here.com']);
                    jobId = jobResponse.body.id;
                });

                it('should successfully create report', async function () {
                    let fullReportBody = Object.assign({}, minimalReportBody);
                    fullReportBody.notes = 'My first performance test';
                    fullReportBody.job_id = jobId;
                    fullReportBody.runner_id = uuid();

                    const reportResponse = await reportsRequestCreator.createReport(testId, fullReportBody);
                    should(reportResponse.statusCode).be.eql(201);

                    const phaseStartedStatsResponse = await reportsRequestCreator.postStats(testId, reportId, statsGenerator.generateStats('started_phase', fullReportBody.runner_id));
                    should(phaseStartedStatsResponse.statusCode).be.eql(204);
                    let getReportResponse = await reportsRequestCreator.getReport(testId, reportId);
                    let report = getReportResponse.body;
                    should(report.status).eql('started');

                    const intermediateStatsResponse = await reportsRequestCreator.postStats(testId, reportId, statsGenerator.generateStats('intermediate', fullReportBody.runner_id));
                    should(intermediateStatsResponse.statusCode).be.eql(204);
                    getReportResponse = await reportsRequestCreator.getReport(testId, reportId);
                    report = getReportResponse.body;
                    should(report.status).eql('in_progress');

                    const doneStatsResponse = await reportsRequestCreator.postStats(testId, reportId, statsGenerator.generateStats('done', fullReportBody.runner_id));
                    should(doneStatsResponse.statusCode).be.eql(204);
                    getReportResponse = await reportsRequestCreator.getReport(testId, reportId);
                    should(getReportResponse.statusCode).be.eql(200);
                    report = getReportResponse.body;
                    validateFinishedReport(report, {
                        notes: 'My first performance test'
                    });

                    await mailhogHelper.validateEmail();
                });
            });
        });

        describe('Get reports', function () {
            const getReportsTestId = uuid();
            let reportId = uuid();
            let reportBody = {
                report_id: reportId,
                revision_id: uuid(),
                test_type: 'basic',
                test_name: 'integration-test',
                test_description: 'doing some integration testing',
                start_time: Date.now().toString(),
                last_updated_at: Date.now().toString(),
                test_configuration: {
                    enviornment: 'test',
                    duration: 10,
                    arrival_rate: 20
                }
            };
            before(async function () {
                const jobResponse = await createJob(testId);
                jobId = jobResponse.body.id;
                reportBody.job_id = jobId;
                reportBody.runner_id = uuid();
                let createReportResponse = await reportsRequestCreator.createReport(getReportsTestId, reportBody);
                should(createReportResponse.statusCode).eql(201);

                reportId = uuid();
                reportBody.report_id = reportId;
                reportBody.runner_id = uuid();
                createReportResponse = await reportsRequestCreator.createReport(getReportsTestId, reportBody);
                should(createReportResponse.statusCode).eql(201);

                reportId = uuid();
                reportBody.report_id = reportId;
                reportBody.runner_id = uuid();
                createReportResponse = await reportsRequestCreator.createReport(getReportsTestId, reportBody);
                should(createReportResponse.statusCode).eql(201);
            });

            it('Get all reports for specific testId', async function () {
                let getReportsResponse = await reportsRequestCreator.getReports(getReportsTestId);
                const reports = getReportsResponse.body;

                should(reports.length).eql(3);

                reports.forEach((report) => {
                    const REPORT_KEYS = ['test_id', 'test_name', 'revision_id', 'report_id', 'job_id', 'test_type', 'start_time',
                        'phase', 'status'];

                    REPORT_KEYS.forEach((key) => {
                        should(report).hasOwnProperty(key);
                    });

                    should(report.status).eql('initializing');
                    should.not.exist(report.end_time);
                });
            });

            it('Get last reports', async function () {
                let lastReportsIdtestId = uuid();
                reportId = uuid();
                reportBody.report_id = reportId;
                reportBody.runner_id = uuid();
                await reportsRequestCreator.createReport(lastReportsIdtestId, reportBody);

                reportId = uuid();
                reportBody.report_id = reportId;
                reportBody.runner_id = uuid();
                await reportsRequestCreator.createReport(lastReportsIdtestId, reportBody);

                let getLastReportsResponse = await reportsRequestCreator.getLastReports(5);
                const lastReports = getLastReportsResponse.body;

                should(lastReports.length).eql(5);

                lastReports.forEach((report) => {
                    const REPORT_KEYS = ['test_id', 'test_name', 'revision_id', 'report_id', 'job_id', 'test_type', 'start_time',
                        'phase', 'status'];

                    REPORT_KEYS.forEach((key) => {
                        should(report).hasOwnProperty(key);
                    });
                });
            });
        });

        describe('Post stats', function () {
            before(async function () {
                const jobResponse = await createJob(testId);
                jobId = jobResponse.body.id;
            });

            beforeEach(async function () {
                testId = uuid();
                reportId = uuid();
                runnerId = uuid();

                minimalReportBody = {
                    runner_id: runnerId,
                    test_type: 'basic',
                    report_id: reportId,
                    revision_id: uuid(),
                    job_id: jobId,
                    test_name: 'integration-test',
                    test_description: 'doing some integration testing',
                    start_time: Date.now().toString(),
                    last_updated_at: Date.now().toString(),
                    test_configuration: {
                        enviornment: 'test',
                        duration: 10,
                        arrival_rate: 20
                    }
                };
                const reportResponse = await reportsRequestCreator.createReport(testId, minimalReportBody);
                should(reportResponse.statusCode).be.eql(201);
            });

            it('Post full cycle stats', async function () {
                const phaseStartedStatsResponse = await reportsRequestCreator.postStats(testId, reportId, statsGenerator.generateStats('started_phase', runnerId));
                should(phaseStartedStatsResponse.statusCode).be.eql(204);
                let getReportResponse = await reportsRequestCreator.getReport(testId, reportId);
                let report = getReportResponse.body;
                should(report.status).eql('started');

                let intermediateStatsResponse = await reportsRequestCreator.postStats(testId, reportId, statsGenerator.generateStats('intermediate', runnerId));
                should(intermediateStatsResponse.statusCode).be.eql(204);
                getReportResponse = await reportsRequestCreator.getReport(testId, reportId);
                report = getReportResponse.body;
                should(report.status).eql('in_progress');

                intermediateStatsResponse = await reportsRequestCreator.postStats(testId, reportId, statsGenerator.generateStats('intermediate', runnerId));
                should(intermediateStatsResponse.statusCode).be.eql(204);
                getReportResponse = await reportsRequestCreator.getReport(testId, reportId);
                report = getReportResponse.body;
                should(report.status).eql('in_progress');

                const doneStatsResponse = await reportsRequestCreator.postStats(testId, reportId, statsGenerator.generateStats('done', runnerId));
                should(doneStatsResponse.statusCode).be.eql(204);
                getReportResponse = await reportsRequestCreator.getReport(testId, reportId);
                should(getReportResponse.statusCode).be.eql(200);
                report = getReportResponse.body;
                validateFinishedReport(report);
            });

            it('Post only "done" phase stats', async function () {
                const doneStatsResponse = await reportsRequestCreator.postStats(testId, reportId, statsGenerator.generateStats('done', runnerId));
                should(doneStatsResponse.statusCode).be.eql(204);
                let getReportResponse = await reportsRequestCreator.getReport(testId, reportId);
                should(getReportResponse.statusCode).be.eql(200);
                let report = getReportResponse.body;
                validateFinishedReport(report);
            });

            it('Post "error" stats', async function () {
                const phaseStartedStatsResponse = await reportsRequestCreator.postStats(testId, reportId, statsGenerator.generateStats('started_phase', runnerId));
                should(phaseStartedStatsResponse.statusCode).be.eql(204);
                let getReportResponse = await reportsRequestCreator.getReport(testId, reportId);
                let report = getReportResponse.body;
                should(report.status).eql('started');

                const intermediateStatsResponse = await reportsRequestCreator.postStats(testId, reportId, statsGenerator.generateStats('intermediate', runnerId));
                should(intermediateStatsResponse.statusCode).be.eql(204);
                getReportResponse = await reportsRequestCreator.getReport(testId, reportId);
                report = getReportResponse.body;
                should(report.status).eql('in_progress');

                const errorStatsResponse = await reportsRequestCreator.postStats(testId, reportId, statsGenerator.generateStats('error', runnerId));
                should(errorStatsResponse.statusCode).be.eql(204);
                getReportResponse = await reportsRequestCreator.getReport(testId, reportId);
                report = getReportResponse.body;
                should(report.status).eql('failed');
            });

            it('Post "aborted" stats', async function () {
                const phaseStartedStatsResponse = await reportsRequestCreator.postStats(testId, reportId, statsGenerator.generateStats('started_phase', runnerId));
                should(phaseStartedStatsResponse.statusCode).be.eql(204);
                let getReportResponse = await reportsRequestCreator.getReport(testId, reportId);
                let report = getReportResponse.body;
                should(report.status).eql('started');

                const intermediateStatsResponse = await reportsRequestCreator.postStats(testId, reportId, statsGenerator.generateStats('intermediate', runnerId));
                should(intermediateStatsResponse.statusCode).be.eql(204);
                getReportResponse = await reportsRequestCreator.getReport(testId, reportId);
                report = getReportResponse.body;
                should(report.status).eql('in_progress');

                const abortedStatsResponse = await reportsRequestCreator.postStats(testId, reportId, statsGenerator.generateStats('aborted', runnerId));
                should(abortedStatsResponse.statusCode).be.eql(204);
                getReportResponse = await reportsRequestCreator.getReport(testId, reportId);
                report = getReportResponse.body;
                should(report.status).eql('aborted');
            });
        });
    });

    describe('Happy flow - with parallelism', function () {
        before(async function () {
            if (!jobId) {
                const jobResponse = await createJob(testId);
                jobBody = jobResponse.body;
                jobId = jobResponse.body.id;
            }
        });
        describe('Create report', function () {
            it('should successfully create report on first call and only subscribe runner on second call', async function () {
                let reportBody = minimalReportBody;
                firstRunner = uuid();
                secondRunner = uuid();

                reportBody.job_id = jobId;
                reportBody.runner_id = firstRunner;
                let reportResponse = await reportsRequestCreator.createReport(testId, reportBody);
                should(reportResponse.statusCode).be.eql(201);

                reportBody.runner_id = secondRunner;
                reportResponse = await reportsRequestCreator.createReport(testId, reportBody);
                should(reportResponse.statusCode).be.eql(201);

                let getReportResponse = await reportsRequestCreator.getReport(testId, reportId);
                let report = getReportResponse.body;
                should(report.status).eql('initializing');
                should(report.notes).eql(jobBody.notes);
                should(report.max_virtual_users).eql(jobBody.max_virtual_users);
                should(report.arrival_rate).eql(jobBody.arrival_rate);
                should(report.duration).eql(jobBody.duration);
                should(report.ramp_to).eql(jobBody.ramp_to);

                should(report.subscribers.length).eql(2);
                const firstSubscriber = report.subscribers.find((subscriber) => {
                    if (subscriber.runner_id === firstRunner) {
                        return subscriber;
                    }
                });

                const secondSubscriber = report.subscribers.find((subscriber) => {
                    if (subscriber.runner_id === firstRunner) {
                        return subscriber;
                    }
                });

                should.exist(firstSubscriber);
                should.exist(secondSubscriber);

                should(firstSubscriber.phase_status).eql(constants.SUBSCRIBER_INITIALIZING_STAGE);
                should(secondSubscriber.phase_status).eql(constants.SUBSCRIBER_INITIALIZING_STAGE);
            });
        });

        describe('Create report, post stats, and get final report', function () {
            it('should successfully create report', async function () {
                let reportBody = minimalReportBody;
                firstRunner = uuid();
                secondRunner = uuid();

                reportBody.job_id = jobId;
                reportBody.runner_id = firstRunner;
                let reportResponse = await reportsRequestCreator.createReport(testId, reportBody);
                should(reportResponse.statusCode).be.eql(201);

                reportBody.runner_id = secondRunner;
                reportResponse = await reportsRequestCreator.createReport(testId, reportBody);
                should(reportResponse.statusCode).be.eql(201);

                let getReportResponse = await reportsRequestCreator.getReport(testId, reportId);
                let report = getReportResponse.body;
                should(report.status).eql('initializing');

                let phaseStartedStatsResponse = await reportsRequestCreator.postStats(testId, reportId, statsGenerator.generateStats('started_phase', firstRunner));
                should(phaseStartedStatsResponse.statusCode).be.eql(204);
                getReportResponse = await reportsRequestCreator.getReport(testId, reportId);
                report = getReportResponse.body;
                should(report.status).eql('started');

                phaseStartedStatsResponse = await reportsRequestCreator.postStats(testId, reportId, statsGenerator.generateStats('started_phase', secondRunner));
                should(phaseStartedStatsResponse.statusCode).be.eql(204);
                getReportResponse = await reportsRequestCreator.getReport(testId, reportId);
                report = getReportResponse.body;
                should(report.status).eql('started');

                let intermediateStatsResponse = await reportsRequestCreator.postStats(testId, reportId, statsGenerator.generateStats('intermediate', firstRunner));
                should(intermediateStatsResponse.statusCode).be.eql(204);
                getReportResponse = await reportsRequestCreator.getReport(testId, reportId);
                report = getReportResponse.body;
                should(report.status).eql('in_progress');

                intermediateStatsResponse = await reportsRequestCreator.postStats(testId, reportId, statsGenerator.generateStats('intermediate', secondRunner));
                should(intermediateStatsResponse.statusCode).be.eql(204);
                getReportResponse = await reportsRequestCreator.getReport(testId, reportId);
                report = getReportResponse.body;
                should(report.status).eql('in_progress');
                should.not.exist(report.end_time);

                let doneStatsResponse = await reportsRequestCreator.postStats(testId, reportId, statsGenerator.generateStats('done', firstRunner));
                should(doneStatsResponse.statusCode).be.eql(204);
                getReportResponse = await reportsRequestCreator.getReport(testId, reportId);
                should(getReportResponse.statusCode).be.eql(200);
                report = getReportResponse.body;
                should(report.status).eql('partially_finished');
                should.exist(report.end_time);

                doneStatsResponse = await reportsRequestCreator.postStats(testId, reportId, statsGenerator.generateStats('done', secondRunner));
                should(doneStatsResponse.statusCode).be.eql(204);
                getReportResponse = await reportsRequestCreator.getReport(testId, reportId);
                should(getReportResponse.statusCode).be.eql(200);
                report = getReportResponse.body;
                validateFinishedReport(report);
            });
        });

        describe('Post stats', function () {
            before(async function () {
                if (!jobId) {
                    const jobResponse = await createJob(testId);
                    jobBody = jobResponse.body;
                    jobId = jobResponse.body.id;
                }
            });

            beforeEach(async function () {
                testId = uuid();
                reportId = uuid();

                firstRunner = uuid();
                secondRunner = uuid();

                minimalReportBody = {
                    test_type: 'basic',
                    report_id: reportId,
                    revision_id: uuid(),
                    job_id: jobId,
                    test_name: 'integration-test',
                    test_description: 'doing some integration testing',
                    start_time: Date.now().toString(),
                    last_updated_at: Date.now().toString(),
                    test_configuration: {
                        enviornment: 'test',
                        duration: 10,
                        arrival_rate: 20
                    }
                };

                minimalReportBody.runner_id = firstRunner;
                let reportResponse = await reportsRequestCreator.createReport(testId, minimalReportBody);
                should(reportResponse.statusCode).be.eql(201);

                minimalReportBody.runner_id = secondRunner;
                reportResponse = await reportsRequestCreator.createReport(testId, minimalReportBody);
                should(reportResponse.statusCode).be.eql(201);
            });

            it('All runners post "done" stats - report finished', async function () {
                let doneStatsResponse = await reportsRequestCreator.postStats(testId, reportId, statsGenerator.generateStats('done', firstRunner));
                should(doneStatsResponse.statusCode).be.eql(204);

                doneStatsResponse = await reportsRequestCreator.postStats(testId, reportId, statsGenerator.generateStats('done', secondRunner));
                should(doneStatsResponse.statusCode).be.eql(204);

                let getReportResponse = await reportsRequestCreator.getReport(testId, reportId);
                should(getReportResponse.statusCode).be.eql(200);
                let report = getReportResponse.body;
                validateFinishedReport(report);
            });

            it('All runners post "error" stats - report failed', async function () {
                let phaseStartedStatsResponse = await reportsRequestCreator.postStats(testId, reportId, statsGenerator.generateStats('error', firstRunner));
                should(phaseStartedStatsResponse.statusCode).be.eql(204);
                let getReportResponse = await reportsRequestCreator.getReport(testId, reportId);
                let report = getReportResponse.body;

                phaseStartedStatsResponse = await reportsRequestCreator.postStats(testId, reportId, statsGenerator.generateStats('error', secondRunner));
                should(phaseStartedStatsResponse.statusCode).be.eql(204);
                getReportResponse = await reportsRequestCreator.getReport(testId, reportId);
                report = getReportResponse.body;
                should(report.status).eql('failed');
            });

            it('All runners post "aborted" stats - report aborted', async function () {
                let phaseStartedStatsResponse = await reportsRequestCreator.postStats(testId, reportId, statsGenerator.generateStats('aborted', firstRunner));
                should(phaseStartedStatsResponse.statusCode).be.eql(204);
                let getReportResponse = await reportsRequestCreator.getReport(testId, reportId);
                let report = getReportResponse.body;

                phaseStartedStatsResponse = await reportsRequestCreator.postStats(testId, reportId, statsGenerator.generateStats('aborted', secondRunner));
                should(phaseStartedStatsResponse.statusCode).be.eql(204);
                getReportResponse = await reportsRequestCreator.getReport(testId, reportId);
                report = getReportResponse.body;
                should(report.status).eql('aborted');
            });

            it('One runner post "error" stats - report partially finished', async function () {
                let phaseStartedStatsResponse = await reportsRequestCreator.postStats(testId, reportId, statsGenerator.generateStats('started_phase', firstRunner));
                should(phaseStartedStatsResponse.statusCode).be.eql(204);
                let getReportResponse = await reportsRequestCreator.getReport(testId, reportId);
                let report = getReportResponse.body;

                phaseStartedStatsResponse = await reportsRequestCreator.postStats(testId, reportId, statsGenerator.generateStats('started_phase', secondRunner));
                should(phaseStartedStatsResponse.statusCode).be.eql(204);
                getReportResponse = await reportsRequestCreator.getReport(testId, reportId);
                report = getReportResponse.body;
                should(report.status).eql('started');

                let intermediateStatsResponse = await reportsRequestCreator.postStats(testId, reportId, statsGenerator.generateStats('intermediate', firstRunner));
                should(intermediateStatsResponse.statusCode).be.eql(204);
                getReportResponse = await reportsRequestCreator.getReport(testId, reportId);
                report = getReportResponse.body;
                should(report.status).eql('in_progress');

                let errorStatsResponse = await reportsRequestCreator.postStats(testId, reportId, statsGenerator.generateStats('error', secondRunner));
                should(errorStatsResponse.statusCode).be.eql(204);
                getReportResponse = await reportsRequestCreator.getReport(testId, reportId);
                report = getReportResponse.body;
                should(report.status).eql('in_progress');

                let doneStatsResponse = await reportsRequestCreator.postStats(testId, reportId, statsGenerator.generateStats('done', firstRunner));
                should(doneStatsResponse.statusCode).be.eql(204);
                getReportResponse = await reportsRequestCreator.getReport(testId, reportId);
                report = getReportResponse.body;
                should(report.status).eql('partially_finished');
            });

            it('One runner post "aborted" stats - report partially finished', async function () {
                let phaseStartedStatsResponse = await reportsRequestCreator.postStats(testId, reportId, statsGenerator.generateStats('started_phase', firstRunner));
                should(phaseStartedStatsResponse.statusCode).be.eql(204);
                let getReportResponse = await reportsRequestCreator.getReport(testId, reportId);
                let report = getReportResponse.body;

                phaseStartedStatsResponse = await reportsRequestCreator.postStats(testId, reportId, statsGenerator.generateStats('started_phase', secondRunner));
                should(phaseStartedStatsResponse.statusCode).be.eql(204);
                getReportResponse = await reportsRequestCreator.getReport(testId, reportId);
                report = getReportResponse.body;
                should(report.status).eql('started');

                let intermediateStatsResponse = await reportsRequestCreator.postStats(testId, reportId, statsGenerator.generateStats('intermediate', firstRunner));
                should(intermediateStatsResponse.statusCode).be.eql(204);
                getReportResponse = await reportsRequestCreator.getReport(testId, reportId);
                report = getReportResponse.body;
                should(report.status).eql('in_progress');

                let errorStatsResponse = await reportsRequestCreator.postStats(testId, reportId, statsGenerator.generateStats('aborted', secondRunner));
                should(errorStatsResponse.statusCode).be.eql(204);
                getReportResponse = await reportsRequestCreator.getReport(testId, reportId);
                report = getReportResponse.body;
                should(report.status).eql('in_progress');

                let doneStatsResponse = await reportsRequestCreator.postStats(testId, reportId, statsGenerator.generateStats('done', firstRunner));
                should(doneStatsResponse.statusCode).be.eql(204);
                getReportResponse = await reportsRequestCreator.getReport(testId, reportId);
                report = getReportResponse.body;
                should(report.status).eql('partially_finished');
            });
        });
    });

    describe('Sad flow', function(){
        describe('400 error codes', function () {
            it('POST report with bad request body', async function() {
                const createReportResponse = await reportsRequestCreator.createReport(uuid(), {});
                createReportResponse.statusCode.should.eql(400);
                createReportResponse.body.should.eql({
                    message: 'Input validation error',
                    validation_errors: [
                        'body should have required property \'test_type\'',
                        'body should have required property \'report_id\'',
                        'body should have required property \'revision_id\'',
                        'body should have required property \'job_id\'',
                        'body should have required property \'test_name\'',
                        'body should have required property \'test_description\'',
                        'body should have required property \'start_time\'',
                        "body should have required property 'runner_id'"
                    ]
                });
            });

            it('POST stats with bad request body', async function() {
                const postStatsResponse = await reportsRequestCreator.postStats(uuid(), uuid(), {});
                postStatsResponse.statusCode.should.eql(400);
                postStatsResponse.body.should.eql({
                    message: 'Input validation error',
                    validation_errors: [
                        'body should have required property \'stats_time\'',
                        'body should have required property \'phase_status\'',
                        'body should have required property \'data\''
                    ]
                });
            });

            it('GET last reports without limit query param', async function() {
                const lastReportsResponse = await reportsRequestCreator.getLastReports();
                lastReportsResponse.statusCode.should.eql(400);
                lastReportsResponse.body.should.eql({
                    message: 'Input validation error',
                    validation_errors: [
                        'query/limit should be integer'
                    ]
                });
            });
        });

        describe('404 error codes', function () {
            it('GET not existing report', async function() {
                const getReportResponse = await reportsRequestCreator.getReport(testId, uuid());
                should(getReportResponse.statusCode).be.eql(404);
                getReportResponse.body.should.eql({
                    message: 'Report not found'
                });
            });

            it('POST stats on not existing report', async function() {
                const postStatsresponse = await reportsRequestCreator.postStats(testId, uuid(), statsGenerator.generateStats('started_phase', uuid()));
                postStatsresponse.statusCode.should.eql(404);
                postStatsresponse.body.should.eql({
                    message: 'Report not found'
                });
            });
        });
    });
});


function validateFinishedReport(report, expectedValues = {}) {
    const REPORT_KEYS = ['test_id', 'test_name', 'revision_id', 'report_id', 'job_id', 'test_type', 'start_time',
        'end_time', 'phase', 'last_updated_at', 'status'];

    REPORT_KEYS.forEach((key) => {
        should(report).hasOwnProperty(key);
    });

    should(report.status).eql('finished');
    should(report.test_id).eql(testId);
    should(report.report_id).eql(reportId);
    should(report.phase).eql('0');

    should.exist(report.duration_seconds);
    should(report.arrival_rate).eql(10);
    should(report.duration).eql(10);

    if (expectedValues) {
        for (let key in expectedValues) {
            should(report[key]).eql(expectedValues[key]);
        }
    }
}

function createJob(testId, emails, webhooks) {
    let jobOptions = {
        test_id: testId,
        arrival_rate: 10,
        duration: 10,
        environment: 'test',
        cron_expression: '0 0 1 * *',
        notes: 'My first performance test',
        max_virtual_users: 500
    };

    if (emails) {
        jobOptions.emails = emails;
    }

    if (webhooks) {
        jobOptions.webhooks = webhooks;
    }

    return jobRequestCreator.createJob(jobOptions, {
        'Content-Type': 'application/json'
    });
}
