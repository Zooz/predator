'use strict';

const should = require('should');
const uuid = require('uuid/v4');

const statsGenerator = require('./helpers/statsGenerator');
const reportsRequestCreator = require('./helpers/requestCreator');
const jobRequestCreator = require('../jobs/helpers/requestCreator');
const testsRequestCreator = require('../tests/helpers/requestCreator');
const configRequestCreator = require('../configManager/helpers/requestCreator');
const config = require('../../../src/common/consts').CONFIG;
const constants = require('../../../src/reports/utils/constants');

const mailhogHelper = require('./mailhog/mailhogHelper');

let testId, reportId, jobId, runnerId, firstRunner, secondRunner, jobBody, minimalReportBody;

describe('Integration tests for the reports api', function() {
    this.timeout(10000);
    before(async () => {
        await reportsRequestCreator.init();
        await testsRequestCreator.init();
        await jobRequestCreator.init();
        await configRequestCreator.init();

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

            describe('Create report with minimal fields', async function () {
                before(async function () {
                    const options = {
                        webhooks: []
                    };
                    const jobResponse = await createJob(testId, options);
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
                    const options = {
                        emails: ['https://webhook.to.here.com']
                    };
                    const jobResponse = await createJob(testId, options);
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
        describe('edit report', function () {
            it('should successfully edit report notes', async function () {
                const reportBody = minimalReportBody;
                const jobResponse = await createJob(testId);
                jobBody = jobResponse.body;
                jobId = jobResponse.body.id;
                reportBody.job_id = jobId;
                reportBody.runner_id = uuid();

                const reportResponse = await reportsRequestCreator.createReport(testId, reportBody);
                should(reportResponse.statusCode).be.eql(201);

                const editBody = {
                    notes: 'edited notes'
                };
                let editReportResponse = await reportsRequestCreator.editReport(testId, reportId, editBody);
                should(editReportResponse.statusCode).eql(204);

                let getReportResponse = await reportsRequestCreator.getReport(testId, reportId);
                let report = getReportResponse.body;
                should(report.status).eql('initializing');
                should(report.notes).eql(editBody.notes);
                should(report.max_virtual_users).eql(jobBody.max_virtual_users);
                should(report.arrival_rate).eql(jobBody.arrival_rate);
                should(report.duration).eql(jobBody.duration);
                should(report.ramp_to).eql(jobBody.ramp_to);
            });
            it('when report id does not exist - should return 404', async function () {
                let editReportResponse = await reportsRequestCreator.editReport(testId, reportId, { notes: 'dfdsf' });
                should(editReportResponse.statusCode).eql(404);
                should(editReportResponse.body).eql({
                    'message': 'Report not found'
                });
            });
            it('when edit additional properties that not include in the swagger', async function () {
                let editReportResponse = await reportsRequestCreator.editReport(testId, reportId, { additional: 'add' });
                should(editReportResponse.statusCode).eql(400);
                should(editReportResponse.body).eql({
                    'message': 'Input validation error',
                    'validation_errors': [
                        "body should NOT have additional properties 'additional'"
                    ]
                });
            });
        });
        describe('Create report, post stats, and get final report', function () {
            describe('Create report with all fields, and post full cycle stats', async function () {
                before(async function () {
                    const options = {
                        webhooks: [],
                        emails: ['mickey@dog.com']
                    };
                    const jobResponse = await createJob(testId, options);
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
                        'phase', 'status', 'avg_rps'];

                    REPORT_KEYS.forEach((key) => {
                        should(report).hasOwnProperty(key);
                    });
                });
            });
            it('Get last reports in right order', async function () {
                let lastReportsIdtestId = uuid();
                const lastReportId = uuid();
                reportBody.report_id = lastReportId;
                reportBody.runner_id = uuid();
                const lastDate = new Date();
                reportBody.start_time = lastDate.setMinutes(lastDate.getMinutes()).toString();
                let createReportResponse = await reportsRequestCreator.createReport(lastReportsIdtestId, reportBody);
                should(createReportResponse.statusCode).eql(201);

                const secondReportId = uuid();
                reportBody.report_id = secondReportId;
                reportBody.runner_id = uuid();
                const secondDate = new Date();
                reportBody.start_time = secondDate.setMinutes(secondDate.getMinutes() + 1).toString();
                createReportResponse = await reportsRequestCreator.createReport(lastReportsIdtestId, reportBody);
                should(createReportResponse.statusCode).eql(201);

                const firstReportId = uuid();
                reportBody.report_id = firstReportId;
                reportBody.runner_id = uuid();
                const firstDate = new Date();
                reportBody.start_time = firstDate.setMinutes(firstDate.getMinutes() + 2).toString();
                createReportResponse = await reportsRequestCreator.createReport(lastReportsIdtestId, reportBody);
                should(createReportResponse.statusCode).eql(201);

                let getLastReportsResponse = await reportsRequestCreator.getLastReports(10);
                const lastReports = getLastReportsResponse.body;
                const sortReports = Object.assign([], lastReports);
                sortReports.sort((a, b) => new Date(b.start_time) - new Date(a.start_time));

                should(lastReports).eql(sortReports);
                const allRelvntResults = lastReports.filter(x => [lastReportId, secondReportId, firstReportId].includes(x.report_id));
                should(allRelvntResults[0].report_id).eql(firstReportId);
                should(allRelvntResults[1].report_id).eql(secondReportId);
                should(allRelvntResults[2].report_id).eql(lastReportId);
            });
        });
        describe('Get report', function () {
            const getReportTestId = uuid();
            let reportId;
            let reportBody = {
                revision_id: uuid(),
                test_type: 'basic',
                test_name: 'integration-test',
                test_description: 'doing some integration testing',
                start_time: Date.now().toString(),
                last_updated_at: Date.now().toString(),
            };
            describe('report of load_test', function () {
                before(async () => {
                    const jobOptions = {
                        arrival_rate: 10
                    };
                    const jobResponse = await createJob(testId, jobOptions);
                    jobId = jobResponse.body.id;

                    reportBody.test_configuration = generateTestConfiguration('load_test');
                    reportId = uuid();
                    reportBody.report_id = reportId;
                    reportBody.job_id = jobId;
                    reportBody.runner_id = uuid();
                    let createReportResponse = await reportsRequestCreator.createReport(getReportTestId, reportBody);
                    should(createReportResponse.statusCode).eql(201);
                });

                it('should return report with arrival_rate in response', async function () {
                    let getReportResponse = await reportsRequestCreator.getReport(getReportTestId, reportId);
                    should(getReportResponse.statusCode).eql(200);
                    const REPORT_KEYS = ['test_id', 'test_name', 'revision_id', 'report_id', 'job_id', 'test_type', 'start_time',
                        'phase', 'status', 'job_type', 'arrival_rate'];
                    REPORT_KEYS.forEach((key) => {
                        should(getReportResponse.body).hasOwnProperty(key);
                    });
                    should(getReportResponse.body.job_type).eql('load_test');
                    should(getReportResponse.body.arrival_rate).eql(10);
                    should(getReportResponse.body.arrival_count).eql(undefined);
                });
            });
            describe('report of functional_test', function () {
                before(async () => {
                    const jobOptions = {
                        arrival_count: 50,
                        type: 'functional_test'
                    };
                    const jobResponse = await createJob(testId, jobOptions);
                    jobId = jobResponse.body.id;

                    reportId = uuid();
                    reportBody.test_configuration = generateTestConfiguration('functional_test');
                    reportBody.report_id = reportId;
                    reportBody.job_id = jobId;
                    reportBody.runner_id = uuid();
                    let createReportResponse = await reportsRequestCreator.createReport(getReportTestId, reportBody);
                    should(createReportResponse.statusCode).eql(201);
                });

                it('should return report with arrival_count in response', async function () {
                    let getReportResponse = await reportsRequestCreator.getReport(getReportTestId, reportId);
                    should(getReportResponse.statusCode).eql(200);
                    const REPORT_KEYS = ['test_id', 'test_name', 'revision_id', 'report_id', 'job_id', 'test_type', 'start_time',
                        'phase', 'status', 'job_type', 'arrival_count'];
                    REPORT_KEYS.forEach((key) => {
                        should(getReportResponse.body).hasOwnProperty(key);
                    });
                    should(getReportResponse.body.job_type === 'functional_test');
                    should(getReportResponse.body.arrival_count).eql(50);
                    should(getReportResponse.body.arrival_rate).eql(undefined);
                });
            });
        });
        describe('Delete reports', function () {
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
            it('Delete report successfully', async function () {
                let testId = uuid();
                const reportId = uuid();
                reportBody.report_id = reportId;
                reportBody.job_id = jobId;

                reportBody.runner_id = uuid();
                const lastDate = new Date();
                reportBody.start_time = lastDate.setMinutes(lastDate.getMinutes() + 10).toString();
                let createReportResponse = await reportsRequestCreator.createReport(testId, reportBody);
                should(createReportResponse.statusCode).eql(201);

                await reportsRequestCreator.postStats(testId, reportId, statsGenerator.generateStats('done', reportBody.runner_id));

                let getLastReportsResponse = await reportsRequestCreator.getLastReports(1);
                console.log(JSON.stringify(getLastReportsResponse));
                let lastReports = getLastReportsResponse.body;
                should(lastReports.length).eql(1);
                should(lastReports[0].report_id).eql(reportId);

                let reportResponse = await reportsRequestCreator.getReport(testId, reportId);
                should(reportResponse.body.report_id).eql(reportId);

                // Delete report
                let deleteResponse = await reportsRequestCreator.deleteReport(testId, reportId);
                should(deleteResponse.statusCode).eql(204);

                // Verify last report not retrieved
                getLastReportsResponse = await reportsRequestCreator.getLastReports(5);
                console.log(JSON.stringify(getLastReportsResponse));
                lastReports = getLastReportsResponse.body;
                const lastReportWithOriginalReportId = lastReports.find(report => report.report_id === reportId);
                should(lastReportWithOriginalReportId).eql(undefined);

                // Verify report not retrieved
                reportResponse = await reportsRequestCreator.getReport(testId, reportId);
                should(reportResponse.statusCode).eql(404);

                // Verify delete report which is deleted returns 404
                deleteResponse = await reportsRequestCreator.deleteReport(testId, reportId);
                should(deleteResponse.statusCode).eql(404);
            });

            it('Delete report which is in progress', async function() {
                let testId = uuid();
                const reportId = uuid();
                reportBody.report_id = reportId;
                reportBody.runner_id = uuid();
                const lastDate = new Date();
                reportBody.start_time = lastDate.setMinutes(lastDate.getMinutes() + 10).toString();
                let createReportResponse = await reportsRequestCreator.createReport(testId, reportBody);
                should(createReportResponse.statusCode).eql(201);

                const deleteRunningTestResponse = await reportsRequestCreator.deleteReport(testId, reportId);
                deleteRunningTestResponse.statusCode.should.eql(409);
                deleteRunningTestResponse.body.should.eql({
                    'message': "Can't delete running test with status initializing"
                });
            });
        });
        describe('Post stats', function () {
            before(async function () {
                const jobResponse = await createJob(testId);
                jobId = jobResponse.body.id;
            });

            beforeEach(async function () {
                reportId = uuid();
                runnerId = uuid();
                let requestBody = require('../../testExamples/Basic_test');
                let response = await testsRequestCreator.createTest(requestBody, {});
                should(response.statusCode).eql(201);
                should(response.body).have.key('id');
                testId = response.body.id;

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
            after(async () => {
                await configRequestCreator.deleteConfig(config.BENCHMARK_WEIGHTS);
                await configRequestCreator.deleteConfig(config.BENCHMARK_THRESHOLD);
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

            it('Post full cycle stats and verify report rps avg', async function () {
                const phaseStartedStatsResponse = await reportsRequestCreator.postStats(testId, reportId, statsGenerator.generateStats('started_phase', runnerId));
                should(phaseStartedStatsResponse.statusCode).be.eql(204);

                const getReport = await reportsRequestCreator.getReport(testId, reportId);
                should(getReport.statusCode).be.eql(200);
                const testStartTime = new Date(getReport.body.start_time);
                const statDateFirst = new Date(testStartTime).setSeconds(testStartTime.getSeconds() + 20);
                let intermediateStatsResponse = await reportsRequestCreator.postStats(testId, reportId, statsGenerator.generateStats('intermediate', runnerId, statDateFirst, 600));
                should(intermediateStatsResponse.statusCode).be.eql(204);
                let getReportResponse = await reportsRequestCreator.getReport(testId, reportId);
                let report = getReportResponse.body;
                should(report.avg_rps).eql(30);

                const statDateSecond = new Date(testStartTime).setSeconds(testStartTime.getSeconds() + 40);
                intermediateStatsResponse = await reportsRequestCreator.postStats(testId, reportId, statsGenerator.generateStats('intermediate', runnerId, statDateSecond, 200));
                should(intermediateStatsResponse.statusCode).be.eql(204);
                getReportResponse = await reportsRequestCreator.getReport(testId, reportId);
                report = getReportResponse.body;
                should(report.avg_rps).eql(20);

                const statDateThird = new Date(testStartTime).setSeconds(testStartTime.getSeconds() + 60);
                const doneStatsResponse = await reportsRequestCreator.postStats(testId, reportId, statsGenerator.generateStats('done', runnerId, statDateThird));
                should(doneStatsResponse.statusCode).be.eql(204);
                getReportResponse = await reportsRequestCreator.getReport(testId, reportId);
                should(getReportResponse.statusCode).be.eql(200);
                report = getReportResponse.body;
                should(report.avg_rps).eql(13.33);
            });

            it('Post only "done" phase stats', async function () {
                const doneStatsResponse = await reportsRequestCreator.postStats(testId, reportId, statsGenerator.generateStats('done', runnerId));
                should(doneStatsResponse.statusCode).be.eql(204);
                let getReportResponse = await reportsRequestCreator.getReport(testId, reportId);
                should(getReportResponse.statusCode).be.eql(200);
                let report = getReportResponse.body;
                validateFinishedReport(report);
            });

            it('Post done phase stats with benchmark data config for test', async () => {
                const benchmarkRequest = {
                    'rps': {
                        'count': 100,
                        'mean': 90.99
                    },
                    'latency': { median: 357.2, p95: 1042 },
                    'errors': { errorTest: 1 },
                    'codes': { codeTest: 1 }
                };
                const config = {
                    benchmark_threshold: 55,
                    benchmark_weights: {
                        percentile_ninety_five: { percentage: 20 },
                        percentile_fifty: { percentage: 30 },
                        server_errors_ratio: { percentage: 20 },
                        client_errors_ratio: { percentage: 20 },
                        rps: { percentage: 10 }
                    }
                };
                const configRes = await configRequestCreator.updateConfig(config);
                should(configRes.statusCode).eql(200);
                const benchmarkRes = await testsRequestCreator.createBenchmark(testId, benchmarkRequest, {});
                should(benchmarkRes.statusCode).eql(201);
                const intermediateStatsResponse = await reportsRequestCreator.postStats(testId, reportId, statsGenerator.generateStats('intermediate', runnerId));
                should(intermediateStatsResponse.statusCode).be.eql(204);
                const doneStatsResponse = await reportsRequestCreator.postStats(testId, reportId, statsGenerator.generateStats('done', runnerId));
                should(doneStatsResponse.statusCode).be.eql(204);
                const getReportResponse = await reportsRequestCreator.getReport(testId, reportId);
                const getLastReport = await reportsRequestCreator.getLastReports(25);
                should(getReportResponse.statusCode).be.eql(200);
                should(getLastReport.statusCode).be.eql(200);

                const report = getReportResponse.body;
                const lastReports = getLastReport.body.filter(report => report.report_id === reportId);
                const lastReport = lastReports[0];
                should(lastReport.report_id).eql(reportId);
                validateFinishedReport(report);
                should(report.score).eql(100);
                should(lastReport.score).eql(100);
                should(lastReport.benchmark_weights_data).eql(report.benchmark_weights_data);
                should(report.benchmark_weights_data).eql({
                    'benchmark_threshold': 55,
                    'rps': {
                        'benchmark_value': 90.99,
                        'report_value': 90.99,
                        'percentage': 0.1,
                        'score': 10
                    },
                    'percentile_ninety_five': {
                        'benchmark_value': 1042,
                        'report_value': 1042,
                        'percentage': 0.2,
                        'score': 20
                    },
                    'percentile_fifty': {
                        'benchmark_value': 357.2,
                        'report_value': 357.2,
                        'percentage': 0.3,
                        'score': 30
                    },
                    'client_errors_ratio': {
                        'benchmark_value': 0,
                        'report_value': 0,
                        'percentage': 0.2,
                        'score': 20
                    },
                    'server_errors_ratio': {
                        'benchmark_value': 0.01,
                        'report_value': 0,
                        'percentage': 0.2,
                        'score': 20
                    }
                });
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
                validateFinishedReport(report, undefined, 'aborted');
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

function validateFinishedReport(report, expectedValues = {}, status) {
    const REPORT_KEYS = ['test_id', 'test_name', 'revision_id', 'report_id', 'job_id', 'test_type', 'start_time',
        'end_time', 'phase', 'last_updated_at', 'status'];

    REPORT_KEYS.forEach((key) => {
        should(report).hasOwnProperty(key);
    });
    status = status || 'finished';
    should(report.status).eql(status);
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

function createJob(testId, { emails, webhooks, type = 'load_test', arrival_count, arrival_rate = 10 } = {}) {
    let jobOptions = {
        test_id: testId,
        type,
        arrival_rate,
        arrival_count,
        duration: 10,
        environment: 'test',
        cron_expression: '0 0 1 * *',
        notes: 'My first performance test',
        max_virtual_users: 500,
        emails,
        webhooks
    };

    return jobRequestCreator.createJob(jobOptions, {
        'Content-Type': 'application/json'
    });
}

function generateTestConfiguration(jobType) {
    return {
        job_type: jobType,
        enviornment: 'test',
        duration: 10,
        arrival_rate: jobType === 'load_test' ? 10 : undefined,
        arrival_count: jobType === 'functional_test' ? 50 : undefined
    };
}
