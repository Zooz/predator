'use strict';

const should = require('should');
const uuid = require('uuid/v4');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const statsGenerator = require('./helpers/statsGenerator');
const reportsRequestCreator = require('./helpers/requestCreator');
const jobRequestCreator = require('../jobs/helpers/requestCreator');
const testsRequestCreator = require('../tests/helpers/requestCreator');

const mailhogHelper = require('./mailhog/mailhogHelper');

let testId, reportId, jobId, minimalReportBody;

describe('Integration tests for the reports api', function() {
    this.timeout(10000);
    before(async () => {
        await reportsRequestCreator.init();

        let requestBody = require('../../testExamples/Custom_test');
        let response = await testsRequestCreator.createTest(requestBody, {});
        should(response.statusCode).eql(201);
        should(response.body).have.key('id');
        testId = response.body.id;
    });

    beforeEach(async function () {
        reportId = uuid();

        minimalReportBody = {
            test_type: 'custom',
            report_id: reportId,
            job_id: undefined,
            revision_id: uuid(),
            test_name: 'integration-test',
            test_description: 'doing some integration testing',
            start_time: Date.now().toString(),
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

    describe('Happy flow', function () {
        describe('Create report', function () {
            describe('Create report with minimal fields and notes', async () => {
                before(async () => {
                    const jobResponse = await createJob(testId);
                    jobId = jobResponse.body.id;
                });

                it('should successfully create report', async () => {
                    let reportBody = Object.assign({ notes: 'My first performance test' }, minimalReportBody);
                    reportBody.job_id = jobId;
                    const reportResponse = await reportsRequestCreator.createReport(testId, reportBody);
                    should(reportResponse.statusCode).be.eql(201);

                    let getReportResponse = await reportsRequestCreator.getReport(testId, reportId);
                    let report = getReportResponse.body;
                    should(report.status).eql('initialized');
                    should(report.last_stats).eql({});
                    should(report.notes).eql(reportBody.notes);
                });
            });

            describe('Create report with minimal fields and webhooks', async () => {
                before(async () => {
                    const jobResponse = await createJob(testId, undefined, ['https://webhook.to.here.com']);
                    jobId = jobResponse.body.id;
                });

                it('should successfully create report', async () => {
                    let reportBody = Object.assign({}, minimalReportBody);
                    reportBody.job_id = jobId;

                    const reportResponse = await reportsRequestCreator.createReport(testId, reportBody);
                    should(reportResponse.statusCode).be.eql(201);

                    let getReportResponse = await reportsRequestCreator.getReport(testId, reportId);
                    let report = getReportResponse.body;

                    should(report.status).eql('initialized');
                    should(report.last_stats).eql({});
                    should(report.notes).eql('');
                });
            });

            describe('Create report with minimal fields and emails', async () => {
                before(async () => {
                    const jobResponse = await createJob(testId, ['mickey@dog.com']);
                    jobId = jobResponse.body.id;
                });

                it('should successfully create report', async () => {
                    let reportBody = Object.assign({}, minimalReportBody);
                    reportBody.job_id = jobId;
                    const reportResponse = await reportsRequestCreator.createReport(testId, reportBody);
                    should(reportResponse.statusCode).be.eql(201);

                    let getReportResponse = await reportsRequestCreator.getReport(testId, reportId);
                    let report = getReportResponse.body;

                    should(report.status).eql('initialized');
                    should(report.last_stats).eql({});
                    should(report.notes).eql('');
                });
            });
        });

        describe('Create report, post stats, and get final html report', function () {
            describe('Create report with all fields, and post full cycle stats', async () => {
                before(async () => {
                    const jobResponse = await createJob(testId, ['mickey@dog.com'], ['https://webhook.here.com']);
                    jobId = jobResponse.body.id;
                });

                it('should successfully create report', async () => {
                    let fullReportBody = Object.assign({}, minimalReportBody);
                    fullReportBody.notes = 'My first performance test';
                    fullReportBody.job_id = jobId;
                    const reportResponse = await reportsRequestCreator.createReport(testId, fullReportBody);
                    should(reportResponse.statusCode).be.eql(201);

                    const phaseStartedStatsResponse = await reportsRequestCreator.postStats(testId, reportId, statsGenerator.generateStats('started_phase'));
                    should(phaseStartedStatsResponse.statusCode).be.eql(204);
                    let getReportResponse = await reportsRequestCreator.getReport(testId, reportId);
                    let report = getReportResponse.body;
                    should(report.status).eql('started');

                    const intermediateStatsResponse = await reportsRequestCreator.postStats(testId, reportId, statsGenerator.generateStats('intermediate'));
                    should(intermediateStatsResponse.statusCode).be.eql(204);
                    getReportResponse = await reportsRequestCreator.getReport(testId, reportId);
                    report = getReportResponse.body;
                    should(report.status).eql('in_progress');

                    const doneStatsResponse = await reportsRequestCreator.postStats(testId, reportId, statsGenerator.generateStats('done'));
                    should(doneStatsResponse.statusCode).be.eql(204);
                    getReportResponse = await reportsRequestCreator.getReport(testId, reportId);
                    should(getReportResponse.statusCode).be.eql(200);
                    report = getReportResponse.body;
                    validateFinishedReport(report, {
                        notes: 'My first performance test'
                    });

                    let getHTMLReportResponse = await reportsRequestCreator.getHTMLReport(testId, reportId);
                    getHTMLReportResponse.statusCode.should.eql(200);
                    const htmlReportText = getHTMLReportResponse.text;
                    validateHTMLReport(htmlReportText);

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
                test_type: 'custom',
                test_name: 'integration-test',
                test_description: 'doing some integration testing',
                start_time: Date.now().toString(),
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

                let createReportResponse = await reportsRequestCreator.createReport(getReportsTestId, reportBody);
                should(createReportResponse.statusCode).eql(201);

                reportId = uuid();
                reportBody.report_id = reportId;
                createReportResponse = await reportsRequestCreator.createReport(getReportsTestId, reportBody);
                should(createReportResponse.statusCode).eql(201);

                reportId = uuid();
                reportBody.report_id = reportId;
                createReportResponse = await reportsRequestCreator.createReport(getReportsTestId, reportBody);
                should(createReportResponse.statusCode).eql(201);
            });

            it('Get all reports for specific testId', async () => {
                let getReportsResponse = await reportsRequestCreator.getReports(getReportsTestId);
                const reports = getReportsResponse.body;

                should(reports.length).eql(3);

                reports.forEach((report) => {
                    const REPORT_KEYS = ['test_id', 'test_name', 'revision_id', 'report_id', 'job_id', 'test_type', 'start_time',
                        'phase', 'status', 'html_report'];

                    REPORT_KEYS.forEach((key) => {
                        should(report).hasOwnProperty(key);
                    });

                    should(report.status).eql('initialized');
                    should.not.exist(report.end_time);
                    should(report.last_stats).eql({});
                });
            });

            it('Get last reports', async () => {
                let lastReportsIdtestId = uuid();
                reportId = uuid();
                reportBody.report_id = reportId;
                await reportsRequestCreator.createReport(lastReportsIdtestId, reportBody);

                reportId = uuid();
                reportBody.report_id = reportId;
                await reportsRequestCreator.createReport(lastReportsIdtestId, reportBody);

                let getLastReportsResponse = await reportsRequestCreator.getLastReports(5);
                const lastReports = getLastReportsResponse.body;

                should(lastReports.length).eql(5);
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

                minimalReportBody = {
                    test_type: 'custom',
                    report_id: reportId,
                    revision_id: uuid(),
                    job_id: jobId,
                    test_name: 'integration-test',
                    test_description: 'doing some integration testing',
                    start_time: Date.now().toString(),
                    test_configuration: {
                        enviornment: 'test',
                        duration: 10,
                        arrival_rate: 20
                    }
                };
                const reportResponse = await reportsRequestCreator.createReport(testId, minimalReportBody);
                should(reportResponse.statusCode).be.eql(201);
            });

            it('Post full cycle stats', async () => {
                const phaseStartedStatsResponse = await reportsRequestCreator.postStats(testId, reportId, statsGenerator.generateStats('started_phase'));
                should(phaseStartedStatsResponse.statusCode).be.eql(204);
                let getReportResponse = await reportsRequestCreator.getReport(testId, reportId);
                let report = getReportResponse.body;
                should(report.status).eql('started');

                let intermediateStatsResponse = await reportsRequestCreator.postStats(testId, reportId, statsGenerator.generateStats('intermediate'));
                should(intermediateStatsResponse.statusCode).be.eql(204);
                getReportResponse = await reportsRequestCreator.getReport(testId, reportId);
                report = getReportResponse.body;
                should(report.status).eql('in_progress');

                intermediateStatsResponse = await reportsRequestCreator.postStats(testId, reportId, statsGenerator.generateStats('intermediate'));
                should(intermediateStatsResponse.statusCode).be.eql(204);
                getReportResponse = await reportsRequestCreator.getReport(testId, reportId);
                report = getReportResponse.body;
                should(report.status).eql('in_progress');

                const doneStatsResponse = await reportsRequestCreator.postStats(testId, reportId, statsGenerator.generateStats('done'));
                should(doneStatsResponse.statusCode).be.eql(204);
                getReportResponse = await reportsRequestCreator.getReport(testId, reportId);
                should(getReportResponse.statusCode).be.eql(200);
                report = getReportResponse.body;
                validateFinishedReport(report);
            });

            it('Post only "done" phase stats', async () => {
                const doneStatsResponse = await reportsRequestCreator.postStats(testId, reportId, statsGenerator.generateStats('done'));
                should(doneStatsResponse.statusCode).be.eql(204);
                let getReportResponse = await reportsRequestCreator.getReport(testId, reportId);
                should(getReportResponse.statusCode).be.eql(200);
                let report = getReportResponse.body;
                validateFinishedReport(report);
            });

            it('Post "error" stats', async () => {
                const phaseStartedStatsResponse = await reportsRequestCreator.postStats(testId, reportId, statsGenerator.generateStats('started_phase'));
                should(phaseStartedStatsResponse.statusCode).be.eql(204);
                let getReportResponse = await reportsRequestCreator.getReport(testId, reportId);
                let report = getReportResponse.body;
                should(report.status).eql('started');

                const intermediateStatsResponse = await reportsRequestCreator.postStats(testId, reportId, statsGenerator.generateStats('intermediate'));
                should(intermediateStatsResponse.statusCode).be.eql(204);
                getReportResponse = await reportsRequestCreator.getReport(testId, reportId);
                report = getReportResponse.body;
                should(report.status).eql('in_progress');

                const errorStatsResponse = await reportsRequestCreator.postStats(testId, reportId, statsGenerator.generateStats('error'));
                should(errorStatsResponse.statusCode).be.eql(204);
                getReportResponse = await reportsRequestCreator.getReport(testId, reportId);
                report = getReportResponse.body;
                should(report.status).eql('failed');
            });

            it('Post "aborted" stats', async () => {
                const phaseStartedStatsResponse = await reportsRequestCreator.postStats(testId, reportId, statsGenerator.generateStats('started_phase'));
                should(phaseStartedStatsResponse.statusCode).be.eql(204);
                let getReportResponse = await reportsRequestCreator.getReport(testId, reportId);
                let report = getReportResponse.body;
                should(report.status).eql('started');

                const intermediateStatsResponse = await reportsRequestCreator.postStats(testId, reportId, statsGenerator.generateStats('intermediate'));
                should(intermediateStatsResponse.statusCode).be.eql(204);
                getReportResponse = await reportsRequestCreator.getReport(testId, reportId);
                report = getReportResponse.body;
                should(report.status).eql('in_progress');

                const abortedStatsResponse = await reportsRequestCreator.postStats(testId, reportId, statsGenerator.generateStats('aborted'));
                should(abortedStatsResponse.statusCode).be.eql(204);
                getReportResponse = await reportsRequestCreator.getReport(testId, reportId);
                report = getReportResponse.body;
                should(report.status).eql('aborted');
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
                        'body should have required property \'test_configuration\''
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
                        'query/limit should be number'
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
                const postStatsresponse = await reportsRequestCreator.postStats(testId, uuid(), statsGenerator.generateStats('started_phase'));
                postStatsresponse.statusCode.should.eql(404);
                postStatsresponse.body.should.eql({
                    message: 'Report not found'
                });
            });
        });
    });
});

function validateLastStats(stats) {
    const LAST_STATS_KEYS = ['timestamp', 'scenariosCreated', 'scenariosCompleted', 'requestsCompleted', 'latency',
        'rps', 'scenarioDuration', 'scenarioCounts', 'errors', 'codes', 'matches'];

    LAST_STATS_KEYS.forEach((key) => {
        should(stats).hasOwnProperty(key);
    });
}

function validateFinishedReport(report, expectedValues = {}) {
    const REPORT_KEYS = ['test_id', 'test_name', 'revision_id', 'report_id', 'job_id', 'test_type', 'start_time',
        'end_time', 'phase', 'last_stats', 'status', 'html_report'];

    REPORT_KEYS.forEach((key) => {
        should(report).hasOwnProperty(key);
    });

    should(report.status).eql('finished');
    should(report.test_id).eql(testId);
    should(report.report_id).eql(reportId);
    should(report.phase).eql('0');

    should.exist(report.duration_seconds);
    should.exist(report.avg_response_time_ms);
    should(report.arrival_rate).eql(20);
    should(report.duration).eql(10);

    validateLastStats(report.last_stats);

    should(report.html_report.includes('/html')).eql(true);

    if (expectedValues) {
        for (let key in expectedValues) {
            should(report[key]).eql(expectedValues[key]);
        }
    }
}

function validateHTMLReport(text) {
    const parsedHTMLReport = new JSDOM(text);
}

function createJob(testId, emails, webhooks) {
    let jobOptions = {
        test_id: testId,
        arrival_rate: 10,
        duration: 10,
        environment: 'test',
        cron_expression: '0 0 1 * *'
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
