'use strict';

const should = require('should');
const uuid = require('uuid/v4');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const statsGenerator = require('./helpers/statsGenerator');
const reportsRequestCreator = require('./helpers/requestCreator');
const mailhogHelper = require('./mailhog/mailhogHelper');

let testId, reportId, minimalReportBody;

describe('System tests for the reports api', function() {
    this.timeout(10000);

    before(async () => {
        await reportsRequestCreator.init();
    });

    beforeEach(async function () {
        testId = uuid();
        reportId = uuid();

        minimalReportBody = {
            test_type: 'custom',
            report_id: reportId,
            revision_id: uuid(),
            job_id: uuid(),
            test_name: 'system-test',
            test_description: 'doing some system testing',
            start_time: Date.now().toString(),
            test_configuration: {
                enviornment: 'test',
                duration: 10,
                arrival_rate: 20
            },
            webhooks: [],
            emails: []
        };
    });

    afterEach(async function () {
        await mailhogHelper.clearAllOldMails();
    });

    describe('Happy flow', function () {
        describe('Create report', function () {
            it('Create report with minimal fields and notes', async () => {
                let reportBody = Object.assign({ notes: 'My first performance test' }, minimalReportBody);
                const reportResponse = await reportsRequestCreator.createReport(testId, reportBody);
                should(reportResponse.statusCode).be.eql(201);

                let getReportResponse = await reportsRequestCreator.getReport(testId, reportId);
                let report = getReportResponse.body;

                should(report.status).eql('initialized');
                should(report.last_stats).eql({});
                should(report.notes).eql(reportBody.notes);
            });

            it('Create report with minimal fields and webhooks', async () => {
                let reportBody = Object.assign({}, minimalReportBody);
                reportBody.webhooks.push('https://webhook.to.here.com');
                const reportResponse = await reportsRequestCreator.createReport(testId, reportBody);
                should(reportResponse.statusCode).be.eql(201);

                let getReportResponse = await reportsRequestCreator.getReport(testId, reportId);
                let report = getReportResponse.body;

                should(report.status).eql('initialized');
                should(report.last_stats).eql({});
                should(report.webhooks).eql(reportBody.webhooks);
                should(report.notes).eql('');
            });

            it('Create report with minimal fields and emails', async () => {
                let reportBody = Object.assign({}, minimalReportBody);
                reportBody.emails.push('mickey@dog.com');
                const reportResponse = await reportsRequestCreator.createReport(testId, reportBody);
                should(reportResponse.statusCode).be.eql(201);

                let getReportResponse = await reportsRequestCreator.getReport(testId, reportId);
                let report = getReportResponse.body;

                should(report.status).eql('initialized');
                should(report.last_stats).eql({});
                should(report.emails).eql(reportBody.emails);
                should(report.notes).eql('');
            });
        });

        describe('Create report, post stats, and get final html report', function () {
            it('Create report with all fields, and post full cycle stats', async () => {
                let fullReportBody = Object.assign({}, minimalReportBody);
                fullReportBody.webhooks = ['https://webhook.here.com'];
                fullReportBody.emails = ['mickey@dog.com'];
                fullReportBody.notes = 'My first performance test';
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
                validateReport(report, {
                    webhooks: ['https://webhook.here.com'],
                    emails: ['mickey@dog.com'],
                    notes: 'My first performance test'
                });

                let getHTMLReportResponse = await reportsRequestCreator.getHTMLReport(testId, reportId);
                getHTMLReportResponse.statusCode.should.eql(200);
                const htmlReportText = getHTMLReportResponse.text;
                validateHTMLReport(htmlReportText);

                await mailhogHelper.validateEmail();
            });
        });

        describe('Get reports', function () {
            const getReportsTestId = uuid();
            let reportId = uuid();
            let reportBody = {
                report_id: reportId,
                revision_id: uuid(),
                job_id: uuid(),
                test_type: 'custom',
                test_name: 'system-test',
                test_description: 'doing some system testing',
                start_time: Date.now().toString(),
                test_configuration: {
                    enviornment: 'test',
                    duration: 10,
                    arrival_rate: 20
                },
                webhooks: [],
                emails: []
            };
            before(async function () {
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
            beforeEach(async function () {
                testId = uuid();
                reportId = uuid();

                minimalReportBody = {
                    test_type: 'custom',
                    report_id: reportId,
                    revision_id: uuid(),
                    job_id: uuid(),
                    test_name: 'system-test',
                    test_description: 'doing some system testing',
                    start_time: Date.now().toString(),
                    test_configuration: {
                        enviornment: 'test',
                        duration: 10,
                        arrival_rate: 20
                    },
                    webhooks: [],
                    emails: []
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
                validateReport(report);
            });

            it('Post only "done" phase stats', async () => {
                const doneStatsResponse = await reportsRequestCreator.postStats(testId, reportId, statsGenerator.generateStats('done'));
                should(doneStatsResponse.statusCode).be.eql(204);
                let getReportResponse = await reportsRequestCreator.getReport(testId, reportId);
                should(getReportResponse.statusCode).be.eql(200);
                let report = getReportResponse.body;
                validateReport(report);
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
                const createReportResponse = await reportsRequestCreator.createReport(testId, {});
                createReportResponse.statusCode.should.eql(400);
                createReportResponse.body.should.eql({message: 'Input validation error',
                    validation_errors: [
                        'body should have required property \'test_type\'',
                        'body should have required property \'report_id\'',
                        'body should have required property \'revision_id\'',
                        'body should have required property \'job_id\'',
                        'body should have required property \'test_name\'',
                        'body should have required property \'test_description\'',
                        'body should have required property \'start_time\'',
                        'body should have required property \'test_configuration\'',
                        'body should have required property \'webhooks\'',
                        'body should have required property \'emails\''
                    ]});
            });

            it('POST stats with bad request body', async function() {
                const postStatsResponse = await reportsRequestCreator.postStats(testId, reportId, {});
                postStatsResponse.statusCode.should.eql(400);
                postStatsResponse.body.should.eql({message: 'Input validation error',
                    validation_errors: [
                        'body should have required property \'stats_time\'',
                        'body should have required property \'phase_status\'',
                        'body should have required property \'data\''
                    ]});
            });

            it('GET last reports without limit query param', async function() {
                const lastReportsResponse = await reportsRequestCreator.getLastReports();
                lastReportsResponse.statusCode.should.eql(400);
                lastReportsResponse.body.should.eql({message: 'Input validation error',
                    validation_errors: [
                        'query/limit should be number'
                    ]});
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

function validateReport(report, expectedValues = {}) {
    const REPORT_KEYS = ['test_id', 'test_name', 'revision_id', 'report_id', 'job_id', 'test_type', 'start_time',
        'end_time', 'phase', 'last_stats', 'status', 'html_report', 'webhooks', 'emails'];

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