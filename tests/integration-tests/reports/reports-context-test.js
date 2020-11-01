/* eslint-disable no-prototype-builtins */
'use strict';

const uuid = require('uuid/v4');
const nock = require('nock');
const { expect } = require('chai');

const statsGenerator = require('./helpers/statsGenerator');
const reportsRequestCreator = require('./helpers/requestCreator');
const jobRequestCreator = require('../jobs/helpers/requestCreator');
const testsRequestCreator = require('../tests/helpers/requestCreator');
const configRequestCreator = require('../configManager/helpers/requestCreator');
const constants = require('../../../src/reports/utils/constants');
const kubernetesConfig = require('../../../src/config/kubernetesConfig');
const basicTest = require('../../testExamples/Basic_test');
const { KUBERNETES } = require('../../../src/common/consts');

const jobPlatform = process.env.JOB_PLATFORM;
const headers = { 'Content-Type': 'application/json', 'x-context-id': 'mickey' };
const wrongContextHeaders = { 'Content-Type': 'application/json', 'x-context-id': 'random' };

(jobPlatform.toUpperCase() === KUBERNETES ? describe : describe.skip)('Reports integration tests', function() {
    before('Init requestCreators', async function() {
        this.timeout(50000)
        await reportsRequestCreator.init();
        await testsRequestCreator.init();
        await jobRequestCreator.init();
        await configRequestCreator.init();
    });
    describe('Reports with context_id', function () {
        describe('createReport and run full cycle', function () {
            let testId, reportId;
            it('Run a full cycle - should return the single created report with context_id', async function () {
                const jobName = 'jobName';
                const id = uuid.v4();
                const runnerId = uuid.v4();

                nockK8sRunnerCreation(kubernetesConfig.kubernetesUrl, jobName, id, kubernetesConfig.kubernetesNamespace);

                const testCreateResponse = await testsRequestCreator.createTest(basicTest, headers);
                expect(testCreateResponse.status).to.be.equal(201);

                testId = testCreateResponse.body.id;
                const job = {
                    test_id: testId,
                    arrival_rate: 1,
                    duration: 1,
                    environment: 'test',
                    run_immediately: true,
                    type: 'load_test',
                    webhooks: [],
                    emails: []
                };

                const jobCreateResponse = await jobRequestCreator.createJob(job, headers);
                expect(jobCreateResponse.status).to.be.equal(201);
                reportId = jobCreateResponse.body.report_id;

                await runFullSingleRunnerCycle(testId, reportId, runnerId);

                const editReportResponse = await reportsRequestCreator.editReport(testId, reportId, { is_favorite: true }, headers);
                expect(editReportResponse.status).to.be.equal(204);

                const createdReportResponse = await reportsRequestCreator.getReport(testId, reportId, headers);
                expect(createdReportResponse.status).to.be.equal(200);

                const getReportsResponse = await reportsRequestCreator.getReports(testId, 'is_favorite', headers);

                expect(getReportsResponse.body).to.be.an('array').and.to.have.lengthOf(1);
                expect(getReportsResponse.body[0]).to.have.property('is_favorite').and.to.be.equal(true);
                expect(getReportsResponse.body[0]).to.be.deep.equal(createdReportResponse.body);

                const getAggregateReportResponse = await reportsRequestCreator.getAggregatedReport(testId, reportId, headers);
                expect(getAggregateReportResponse.status).to.be.equal(200);

                const getLastReportsResponse = await reportsRequestCreator.getLastReports(10, undefined, headers);
                expect(getLastReportsResponse.body.length).to.be.greaterThan(0);
            });
            describe('actions on report with wrong context_id', async function () {
                it('get report with wrong context_id should return 404', async function () {
                    const editReportResponse = await reportsRequestCreator.getReport(testId, reportId, wrongContextHeaders);
                    expect(editReportResponse.status).to.be.equal(404);
                });
                it('get aggregate report with wrong context_id should return 404', async function () {
                    const editReportResponse = await reportsRequestCreator.getAggregatedReport(testId, reportId, wrongContextHeaders);
                    expect(editReportResponse.status).to.be.equal(404);
                });
                it('get last reports with wrong context_id should return no reports', async function () {
                    const editReportResponse = await reportsRequestCreator.getLastReports(10, undefined, wrongContextHeaders);
                    expect(editReportResponse.body.length).to.be.equal(0);
                });
                it('edit report with wrong context_id should return 404', async function () {
                    const editReportResponse = await reportsRequestCreator.editReport(testId, reportId, { is_favorite: true }, wrongContextHeaders);
                    expect(editReportResponse.status).to.be.equal(404);
                });
                it('delete report with wrong context_id should return 404', async function () {
                    const editReportResponse = await reportsRequestCreator.deleteReport(testId, reportId, wrongContextHeaders);
                    expect(editReportResponse.status).to.be.equal(404);
                });
            });
            describe('actions on report without context_id', async function () {
                it('get report should return 200', async function () {
                    const editReportResponse = await reportsRequestCreator.getReport(testId, reportId);
                    expect(editReportResponse.status).to.be.equal(200);
                });
                it('get aggregate report should return 200', async function () {
                    const editReportResponse = await reportsRequestCreator.getAggregatedReport(testId, reportId);
                    expect(editReportResponse.status).to.be.equal(200);
                });
                it('get last reports should return reports', async function () {
                    const editReportResponse = await reportsRequestCreator.getLastReports(10);
                    expect(editReportResponse.body.length).to.be.greaterThan(0);
                });
                it('edit report should return 204', async function () {
                    const editReportResponse = await reportsRequestCreator.editReport(testId, reportId, { is_favorite: true });
                    expect(editReportResponse.status).to.be.equal(204);
                });
                it('delete report should return 204', async function () {
                    const editReportResponse = await reportsRequestCreator.deleteReport(testId, reportId);
                    expect(editReportResponse.status).to.be.equal(204);
                });
            })
        });
        describe('deleteReport', async function () {
            it('delete report with context_id return 204', async function () {
                const jobName = 'jobName';
                const id = uuid.v4();
                const runnerId = uuid.v4();

                nockK8sRunnerCreation(kubernetesConfig.kubernetesUrl, jobName, id, kubernetesConfig.kubernetesNamespace);

                const testCreateResponse = await testsRequestCreator.createTest(basicTest, headers);
                expect(testCreateResponse.status).to.be.equal(201);

                const testId = testCreateResponse.body.id;
                const job = {
                    test_id: testId,
                    arrival_rate: 1,
                    duration: 1,
                    environment: 'test',
                    run_immediately: true,
                    type: 'load_test',
                    webhooks: [],
                    emails: []
                };

                const jobCreateResponse = await jobRequestCreator.createJob(job, headers);
                expect(jobCreateResponse.status).to.be.equal(201);
                const reportId = jobCreateResponse.body.report_id;

                await runFullSingleRunnerCycle(testId, reportId, runnerId);

                const deleteResponse = await reportsRequestCreator.deleteReport(testId, reportId);
                expect(deleteResponse.status).to.be.equal(204);

                const getResponse = await reportsRequestCreator.getReport(testId, reportId);
                expect(getResponse.status).to.be.equal(404);
            });
            it('delete report with wrong context_id return 404', async function () {
                const jobName = 'jobName';
                const id = uuid.v4();

                nockK8sRunnerCreation(kubernetesConfig.kubernetesUrl, jobName, id, kubernetesConfig.kubernetesNamespace);

                const testCreateResponse = await testsRequestCreator.createTest(basicTest, headers);
                expect(testCreateResponse.status).to.be.equal(201);

                const testId = testCreateResponse.body.id;
                const job = {
                    test_id: testId,
                    arrival_rate: 1,
                    duration: 1,
                    environment: 'test',
                    run_immediately: true,
                    type: 'load_test',
                    webhooks: [],
                    emails: []
                };

                const jobCreateResponse = await jobRequestCreator.createJob(job, headers);
                expect(jobCreateResponse.status).to.be.equal(201);
                const reportId = jobCreateResponse.body.report_id;

                const deleteResponse = await reportsRequestCreator.deleteReport(testId, reportId, wrongContextHeaders);
                expect(deleteResponse.status).to.be.equal(404);

                const getResponse = await reportsRequestCreator.getReport(testId, reportId, wrongContextHeaders);
                expect(getResponse.status).to.be.equal(404);
            });
        });
    });
});

function nockK8sRunnerCreation(url, name, uid, namespace) {
    nock(url).persist()
        .post(`/apis/batch/v1/namespaces/${namespace}/jobs`)
        .reply(200, {
            metadata: { name, uid },
            namespace: namespace
        });
}

async function sleep(timeInMs) {
    return new Promise((resolve) => {
        setTimeout(resolve, timeInMs);
    });
}

async function assertReportStatus(testId, reportId, status, headers) {
    const getReportResponse = await reportsRequestCreator.getReport(testId, reportId, headers);
    expect(getReportResponse.status).to.be.equal(200);
    expect(getReportResponse.body).to.have.property('status').and.to.be.equal(status);
    return getReportResponse;
}

async function assertPostStats(testId, reportId, runnerId, status) {
    const statsFromRunnerDone = statsGenerator.generateStats(status, runnerId);
    const postStatsRunnerDone = await reportsRequestCreator.postStats(testId, reportId, statsFromRunnerDone);
    expect(postStatsRunnerDone.status).to.be.equal(204);
    return postStatsRunnerDone;
}

async function assertRunnerSubscriptionToReport(testId, reportId, runnerId, headers) {
    const subscribeRunnerToReportResponse = await reportsRequestCreator.subscribeRunnerToReport(testId, reportId, runnerId, headers);
    expect(subscribeRunnerToReportResponse.status).to.be.equal(204);
    return subscribeRunnerToReportResponse;
}

async function runFullSingleRunnerCycle(testId, reportId, runnerId, headers) {
    await assertRunnerSubscriptionToReport(testId, reportId, runnerId, headers);
    await assertReportStatus(testId, reportId, constants.REPORT_INITIALIZING_STATUS, headers);
    await assertPostStats(testId, reportId, runnerId, constants.SUBSCRIBER_STARTED_STAGE, headers);
    await assertReportStatus(testId, reportId, constants.REPORT_STARTED_STATUS, headers);
    await assertPostStats(testId, reportId, runnerId, constants.SUBSCRIBER_INTERMEDIATE_STAGE, headers);
    await assertReportStatus(testId, reportId, constants.REPORT_IN_PROGRESS_STATUS, headers);
    await assertPostStats(testId, reportId, runnerId, constants.SUBSCRIBER_DONE_STAGE, headers);
    await assertReportStatus(testId, reportId, constants.REPORT_FINISHED_STATUS, headers);
}