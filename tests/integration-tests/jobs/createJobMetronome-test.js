let should = require('should');
let uuid = require('uuid');
let schedulerRequestCreator = require('./helpers/requestCreator');
let testsRequestCreator = require('../tests/helpers/requestCreator');
let nock = require('nock');
let serviceConfig = require('../../../src/config/serviceConfig');
let metronomeConfig = require('../../../src/config/metronomeConfig');

describe('Create job specific metronome tests', () => {
    let testId;
    let expectedResult;
    before(async () => {
        await schedulerRequestCreator.init();
        await testsRequestCreator.init();

        let requestBody = require('../../testExamples/Custom_test');
        let response = await testsRequestCreator.createTest(requestBody, {});
        should(response.statusCode).eql(201);
        should(response.body).have.key('id');
        testId = response.body.id;

        expectedResult = {
            environment: 'test',
            test_id: testId,
            duration: 1,
            arrival_rate: 1
        };
    });

    beforeEach(async () => {
        nock.cleanAll();
    });

    if (serviceConfig.jobPlatform === 'METRONOME') {
        describe('Metronome', () => {
            describe('Good requests', () => {
                let jobId;

                describe('Create one time job, job not yet exists, should create job with the right parameters and run it, finally stop and delete it', () => {
                    let createJobResponse;
                    let getJobsFromService;
                    let jobResponseBody;

                    it('Create the job', async () => {
                        let validBody = {
                            test_id: testId,
                            arrival_rate: 1,
                            duration: 1,
                            environment: 'test',
                            run_immediately: true
                        };

                        nock(metronomeConfig.metronomeUrl)
                            .get(url => {
                                return url.startsWith('/v1/jobs/predator.');
                            }).reply(404);

                        nock(metronomeConfig.metronomeUrl).post('/v1/jobs')
                            .reply(200, {
                                id: 'deployId'
                            });

                        nock(metronomeConfig.metronomeUrl).post(
                            url => {
                                return url.startsWith('/v1/jobs') && url.endsWith('/runs');
                            }).reply(200, {
                            id: 'runId'
                        });

                        createJobResponse = await schedulerRequestCreator.createJob(validBody, {
                            'Content-Type': 'application/json'
                        });

                        should(createJobResponse.status).eql(201);
                        should(createJobResponse.body).containEql(expectedResult);
                        jobResponseBody = createJobResponse.body;
                    });

                    it('Get the job', async () => {
                        jobId = createJobResponse.body.id;
                        getJobsFromService = await schedulerRequestCreator.getJob(jobId, {
                            'Content-Type': 'application/json'
                        });

                        should(getJobsFromService.status).eql(200);
                        should(getJobsFromService.body).containEql(expectedResult);
                    });

                    it('Stop run', async () => {
                        nock(metronomeConfig.metronomeUrl)
                            .post(`/v1/jobs/predator.${jobResponseBody.id}/runs/${jobResponseBody.run_id}/actions/stop`)
                            .reply(200);

                        let stopRunResponse = await schedulerRequestCreator.stopRun(createJobResponse.body.id, createJobResponse.body.run_id, {
                            'Content-Type': 'application/json'
                        });

                        should(stopRunResponse.status).eql(200);
                    });

                    it('Delete job', async () => {
                        let deleteJobResponse = await schedulerRequestCreator.deleteJobFromScheduler(jobId);
                        should(deleteJobResponse.status).eql(200);

                        jobId = createJobResponse.body.id;
                        getJobsFromService = await schedulerRequestCreator.getJob(jobId, {
                            'Content-Type': 'application/json'
                        });

                        should(getJobsFromService.status).eql(404);
                    });
                });

                describe('Create one time job, job already exists, should update the job with the right parameters and run it, finally stop and delete it', () => {
                    let createJobResponse;
                    let getJobsFromService;
                    let jobResponseBody;

                    it('Create the job', async () => {

                        let validBody = {
                            test_id: testId,
                            arrival_rate: 1,
                            duration: 1,
                            environment: 'test',
                            run_immediately: true
                        };

                        nock(metronomeConfig.metronomeUrl)
                            .get(url => {
                                return url.startsWith('/v1/jobs/predator.');
                            }).reply(200);

                        nock(metronomeConfig.metronomeUrl).put(url => {
                            return url.startsWith('/v1/jobs/');
                        }).reply(200, {
                            id: 'deployId'
                        });

                        nock(metronomeConfig.metronomeUrl).post(
                            url => {
                                return url.startsWith('/v1/jobs') && url.endsWith('/runs');
                            }).reply(200, {
                            id: 'runId'
                        });

                        createJobResponse = await schedulerRequestCreator.createJob(validBody, {
                            'Content-Type': 'application/json'
                        });

                        should(createJobResponse.status).eql(201);
                        should(createJobResponse.body).containEql(expectedResult);
                        jobResponseBody = createJobResponse.body;
                    });

                    it('Get the job', async () => {
                        jobId = createJobResponse.body.id;
                        getJobsFromService = await schedulerRequestCreator.getJob(jobId, {
                            'Content-Type': 'application/json'
                        });

                        should(getJobsFromService.status).eql(200);
                        should(getJobsFromService.body).containEql(expectedResult);
                    });

                    it('Stop run', async () => {
                        nock(metronomeConfig.metronomeUrl)
                            .post(`/v1/jobs/predator.${jobResponseBody.id}/runs/${jobResponseBody.run_id}/actions/stop`)
                            .reply(200);

                        let stopRunResponse = await schedulerRequestCreator.stopRun(createJobResponse.body.id, createJobResponse.body.run_id, {
                            'Content-Type': 'application/json'
                        });

                        should(stopRunResponse.status).eql(200);
                    });

                    it('Delete job', async () => {
                        let deleteJobResponse = await schedulerRequestCreator.deleteJobFromScheduler(jobId);
                        should(deleteJobResponse.status).eql(200);

                        jobId = createJobResponse.body.id;
                        getJobsFromService = await schedulerRequestCreator.getJob(jobId, {
                            'Content-Type': 'application/json'
                        });

                        should(getJobsFromService.status).eql(404);
                    });
                });
            });
        });
    }
}).timeout(20000);