const should = require('should'),
    uuid = require('uuid'),
    schedulerRequestCreator = require('./helpers/requestCreator'),
    testsRequestCreator = require('../tests/helpers/requestCreator'),
    nock = require('nock'),
    kubernetesConfig = require('../../../src/config/kubernetesConfig');

describe('Create job specific kubernetes tests', async function () {
    this.timeout(20000);
    let testId;

    beforeEach(async () => {
        nock.cleanAll();
    });
    const jobPlatform = process.env.JOB_PLATFORM;
    if (jobPlatform === 'KUBERNETES') {
        describe('Kubernetes', () => {
            describe('Good requests', () => {
                before(async () => {
                    await schedulerRequestCreator.init();
                    await testsRequestCreator.init();

                    let requestBody = require('../../testExamples/Basic_test');
                    let response = await testsRequestCreator.createTest(requestBody, {});
                    should(response.statusCode).eql(201);
                    should(response.body).have.key('id');
                    testId = response.body.id;
                });
                let jobId;
                describe('Create two jobs, one is one time, second one is cron and get them', () => {
                    let createJobResponse;
                    let getJobsFromService;
                    let cronJobId;
                    let oneTimeJobId;

                    it('Create first job which is one time', async () => {
                        nock(kubernetesConfig.kubernetesUrl).post(`/apis/batch/v1/namespaces/${kubernetesConfig.kubernetesNamespace}/jobs`)
                            .reply(200, {
                                metadata: { name: 'jobName', uid: 'uid' },
                                namespace: kubernetesConfig.kubernetesNamespace
                            });

                        let jobBody = {
                            test_id: testId,
                            arrival_rate: 1,
                            duration: 1,
                            environment: 'test',
                            run_immediately: true
                        };

                        createJobResponse = await schedulerRequestCreator.createJob(jobBody, {
                            'Content-Type': 'application/json'
                        });

                        should(createJobResponse.status).eql(201);
                        oneTimeJobId = createJobResponse.body.id;
                    });

                    it('Create second job which is cron', async () => {
                        let jobBody = {
                            test_id: testId,
                            arrival_rate: 1,
                            duration: 1,
                            environment: 'test',
                            run_immediately: false,
                            cron_expression: '* 10 * * * *'
                        };

                        createJobResponse = await schedulerRequestCreator.createJob(jobBody, {
                            'Content-Type': 'application/json'
                        });

                        should(createJobResponse.status).eql(201);
                        cronJobId = createJobResponse.body.id;
                    });

                    it('Get the jobs, without one_time query param, only cron job should be returned', async () => {
                        getJobsFromService = await schedulerRequestCreator.getJobs({
                            'Content-Type': 'application/json'
                        });

                        should(getJobsFromService.status).eql(200);

                        let relevantJobs = getJobsFromService = getJobsFromService.body.filter(job => job.id === cronJobId || job.id === oneTimeJobId);
                        should(relevantJobs.length).eql(1);
                        should(relevantJobs[0].id).eql(cronJobId);
                    });

                    it('Get the jobs, with one_time query param, two jobs should be returned', async () => {
                        getJobsFromService = await schedulerRequestCreator.getJobs({
                            'Content-Type': 'application/json'
                        }, true);

                        should(getJobsFromService.status).eql(200);

                        let relevantJobs = getJobsFromService = getJobsFromService.body.filter(job => job.id === cronJobId || job.id === oneTimeJobId);
                        should(relevantJobs.length).eql(2);
                        should(relevantJobs).containEql({
                            id: oneTimeJobId,
                            test_id: testId,
                            arrival_rate: 1,
                            duration: 1,
                            environment: 'test',
                            enabled: true });

                        should(relevantJobs).containEql({
                            id: cronJobId,
                            test_id: testId,
                            cron_expression: '* 10 * * * *',
                            arrival_rate: 1,
                            duration: 1,
                            environment: 'test',
                            enabled: true
                        });
                    });

                    it('Delete jobs', async () => {
                        await schedulerRequestCreator.deleteJobFromScheduler(cronJobId);
                        await schedulerRequestCreator.deleteJobFromScheduler(oneTimeJobId);
                    });
                });

                describe('Create cron job which is disabled, should not run, enable the job, should run', () => {
                    let createJobResponse;
                    let getJobsFromService;
                    let numberOfCallsToRunTest = 0;
                    beforeEach(() => {
                        nock(kubernetesConfig.kubernetesUrl).post(`/apis/batch/v1/namespaces/${kubernetesConfig.kubernetesNamespace}/jobs`)
                            .reply(200, () => {
                                numberOfCallsToRunTest++;
                                return {
                                    metadata: { name: 'jobName', uid: 'uid' },
                                    namespace: kubernetesConfig.kubernetesNamespace
                                };
                            });
                    });

                    it('Create job which is disabled', async () => {
                        let jobBody = {
                            test_id: testId,
                            arrival_rate: 1,
                            duration: 1,
                            environment: 'test',
                            run_immediately: false,
                            cron_expression: '* * * * * *',
                            enabled: false
                        };

                        createJobResponse = await schedulerRequestCreator.createJob(jobBody, {
                            'Content-Type': 'application/json'
                        });

                        should(createJobResponse.status).eql(201);
                    });

                    it('Get the job', async () => {
                        jobId = createJobResponse.body.id;
                        getJobsFromService = await schedulerRequestCreator.getJob(jobId, {
                            'Content-Type': 'application/json'
                        });

                        should(getJobsFromService.status).eql(200);
                        should(getJobsFromService.body.enabled).eql(false);
                    });

                    it('Wait 4 seconds to let scheduler run the job', (done) => {
                        setTimeout(done, 4000);
                    });

                    it('Verify job did not run', () => {
                        should(numberOfCallsToRunTest).eql(0);
                    });

                    it('Enable job', async () => {
                        await schedulerRequestCreator.updateJob(jobId, { enabled: true }, {
                            'Content-Type': 'application/json'
                        });
                    });

                    it('Wait 4 seconds to let scheduler run the job', (done) => {
                        setTimeout(done, 4000);
                    });

                    it('Verify job did run', () => {
                        should(numberOfCallsToRunTest).greaterThanOrEqual(1);
                    });
                });

                describe('Create one time job with max virtual users, should create job with the right parameters and run it, finally stop and delete it', () => {
                    let createJobResponse;
                    let getJobsFromService;
                    let expectedResult;
                    it('Create the job', async () => {
                        let validBody = {
                            test_id: testId,
                            arrival_rate: 1,
                            duration: 1,
                            environment: 'test',
                            run_immediately: true,
                            max_virtual_users: 500
                        };

                        expectedResult = {
                            environment: 'test',
                            test_id: testId,
                            duration: 1,
                            arrival_rate: 1,
                            max_virtual_users: 500
                        };

                        nock(kubernetesConfig.kubernetesUrl).post(`/apis/batch/v1/namespaces/${kubernetesConfig.kubernetesNamespace}/jobs`)
                            .reply(200, {
                                metadata: { name: 'jobName', uid: 'uid' },
                                namespace: kubernetesConfig.kubernetesNamespace
                            });

                        createJobResponse = await schedulerRequestCreator.createJob(validBody, {
                            'Content-Type': 'application/json'
                        });

                        should(createJobResponse.status).eql(201);
                        should(createJobResponse.body).containEql(expectedResult);
                    });

                    it('Get the job', async () => {
                        jobId = createJobResponse.body.id;
                        getJobsFromService = await schedulerRequestCreator.getJob(jobId, {
                            'Content-Type': 'application/json'
                        });

                        should(getJobsFromService.status).eql(200);
                        should(getJobsFromService.body).containEql(expectedResult);
                    });

                    it('Get logs', async () => {
                        nock(kubernetesConfig.kubernetesUrl).get(`/apis/batch/v1/namespaces/${kubernetesConfig.kubernetesNamespace}/jobs/predator.${createJobResponse.body.id}-${createJobResponse.body.run_id}`)
                            .reply(200, {
                                spec: { selector: { matchLabels: { 'controller-uid': 'uid' } } }
                            });

                        nock(kubernetesConfig.kubernetesUrl).get(`/api/v1/namespaces/${kubernetesConfig.kubernetesNamespace}/pods?labelSelector=controller-uid=uid`)
                            .reply(200, {
                                items: [{ metadata: { name: 'podA' } }, { metadata: { name: 'podB' } }]
                            });

                        nock(kubernetesConfig.kubernetesUrl).get(`/api/v1/namespaces/${kubernetesConfig.kubernetesNamespace}/pods/podA/log?container=predator`)
                            .reply(200, {
                                items: [{ content: 'log' }]
                            });

                        nock(kubernetesConfig.kubernetesUrl).get(`/api/v1/namespaces/${kubernetesConfig.kubernetesNamespace}/pods/podB/log?container=predator`)
                            .reply(200, {
                                items: [{ content: 'log' }]
                            });

                        let getLogsResponse = await schedulerRequestCreator.getLogs(createJobResponse.body.id, createJobResponse.body.run_id, {
                            'Content-Type': 'application/json'
                        });

                        should(getLogsResponse.status).eql(200);
                        should(getLogsResponse.headers['content-type']).eql('application/zip');
                    });

                    it('Stop run', async () => {
                        nock(kubernetesConfig.kubernetesUrl).delete(`/apis/batch/v1/namespaces/${kubernetesConfig.kubernetesNamespace}/jobs/predator.${createJobResponse.body.id}-${createJobResponse.body.run_id}?propagationPolicy=Foreground`)
                            .reply(200);

                        let stopRunResponse = await schedulerRequestCreator.stopRun(createJobResponse.body.id, createJobResponse.body.run_id, {
                            'Content-Type': 'application/json'
                        });

                        should(stopRunResponse.status).eql(204);
                    });

                    it('Delete job', async () => {
                        let deleteJobResponse = await schedulerRequestCreator.deleteJobFromScheduler(jobId);
                        should(deleteJobResponse.status).eql(204);

                        jobId = createJobResponse.body.id;
                        getJobsFromService = await schedulerRequestCreator.getJob(jobId, {
                            'Content-Type': 'application/json'
                        });

                        should(getJobsFromService.status).eql(404);
                    });
                });

                describe('Create one time job with parallelism, should create job with the right parameters and run it, finally stop and delete it', () => {
                    let createJobResponse;
                    let getJobsFromService;
                    let expectedResult;
                    it('Create the job', async () => {
                        let validBody = {
                            test_id: testId,
                            arrival_rate: 100,
                            ramp_to: 150,
                            max_virtual_users: 200,
                            duration: 1,
                            parallelism: 7,
                            environment: 'test',
                            run_immediately: true
                        };

                        expectedResult = {
                            environment: 'test',
                            test_id: testId,
                            arrival_rate: 100,
                            ramp_to: 150,
                            duration: 1,
                            parallelism: 7
                        };
                        let actualJobEnvVars = {};
                        nock(kubernetesConfig.kubernetesUrl).post(`/apis/batch/v1/namespaces/${kubernetesConfig.kubernetesNamespace}/jobs`, body => {
                            actualJobEnvVars = body.spec.template.spec.containers['0'].env;
                            return true;
                        }).reply(200, {
                            metadata: { name: 'jobName', uid: 'uid' },
                            namespace: kubernetesConfig.kubernetesNamespace
                        });

                        createJobResponse = await schedulerRequestCreator.createJob(validBody, {
                            'Content-Type': 'application/json'
                        });

                        should(createJobResponse.status).eql(201);
                        should(createJobResponse.body).containEql(expectedResult);

                        let rampTo = actualJobEnvVars.find(env => env.name === 'RAMP_TO');
                        should.exists(rampTo);

                        let arrivalRate = actualJobEnvVars.find(env => env.name === 'ARRIVAL_RATE');
                        should.exists(arrivalRate);

                        let maxVirtualUsers = actualJobEnvVars.find(env => env.name === 'MAX_VIRTUAL_USERS');
                        should.exists(maxVirtualUsers);

                        should(rampTo.value).eql('22');
                        should(arrivalRate.value).eql('15');
                        should(maxVirtualUsers.value).eql('29');
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
                        nock(kubernetesConfig.kubernetesUrl).delete(`/apis/batch/v1/namespaces/${kubernetesConfig.kubernetesNamespace}/jobs/predator.${createJobResponse.body.id}-${createJobResponse.body.run_id}?propagationPolicy=Foreground`)
                            .reply(200);

                        let stopRunResponse = await schedulerRequestCreator.stopRun(createJobResponse.body.id, createJobResponse.body.run_id, {
                            'Content-Type': 'application/json'
                        });

                        should(stopRunResponse.status).eql(204);
                    });

                    it('Delete job', async () => {
                        let deleteJobResponse = await schedulerRequestCreator.deleteJobFromScheduler(jobId);
                        should(deleteJobResponse.status).eql(204);

                        jobId = createJobResponse.body.id;
                        getJobsFromService = await schedulerRequestCreator.getJob(jobId, {
                            'Content-Type': 'application/json'
                        });

                        should(getJobsFromService.status).eql(404);
                    });

                    it('Delete the containers', async () => {
                        nock(kubernetesConfig.kubernetesUrl).get(`/apis/batch/v1/namespaces/${kubernetesConfig.kubernetesNamespace}/jobs?labelSelector=app=predator`)
                            .reply(200, {
                                items: [{ metadata: { uid: 'x' } }, { metadata: { uid: 'y' } }]
                            });

                        nock(kubernetesConfig.kubernetesUrl).get(`/api/v1/namespaces/${kubernetesConfig.kubernetesNamespace}/pods?labelSelector=controller-uid=x`)
                            .reply(200, {
                                items: [{ metadata: { name: 'podA' } }]
                            });

                        nock(kubernetesConfig.kubernetesUrl).get(`/api/v1/namespaces/${kubernetesConfig.kubernetesNamespace}/pods?labelSelector=controller-uid=y`)
                            .reply(200, {
                                items: [{ metadata: { name: 'podB' } }]
                            });

                        nock(kubernetesConfig.kubernetesUrl).get(`/api/v1/namespaces/${kubernetesConfig.kubernetesNamespace}/pods/podA`)
                            .reply(200, {
                                metadata: { labels: { 'job-name': 'predator.job' } },
                                status: { containerStatuses: [{ name: 'predator',
                                    state: { terminated: { finishedAt: '2020' } } }, { name: 'podB',
                                    state: {} }] }

                            });

                        nock(kubernetesConfig.kubernetesUrl).get(`/api/v1/namespaces/${kubernetesConfig.kubernetesNamespace}/pods/podB`)
                            .reply(200, {
                                metadata: { labels: { 'job-name': 'someJob.job' } },
                                status: { containerStatuses: [{ name: 'podC',
                                    state: { terminated: { finishedAt: '2020' } } }, { name: 'podD',
                                    state: {} }] }

                            });

                        nock(kubernetesConfig.kubernetesUrl).delete(`/apis/batch/v1/namespaces/${kubernetesConfig.kubernetesNamespace}/jobs/predator.job?propagationPolicy=Foreground`)
                            .reply(200);

                        let deleteJobResponse = await schedulerRequestCreator.deletePredatorRunnerContainers();
                        should(deleteJobResponse.status).eql(200);
                        should(deleteJobResponse.body.deleted).eql(1);
                    });
                });

                [true, false].forEach((runImmediately) => {
                    describe.skip('Create a scheduled job, should create job with the right parameters and run_immediately parameter is ' + runImmediately, async () => {
                        let createJobResponse;
                        let date;
                        let jobId;
                        let numberOfCallsToRunTest = 0;

                        beforeEach(() => {
                            nock(kubernetesConfig.kubernetesUrl).post(`/apis/batch/v1/namespaces/${kubernetesConfig.kubernetesNamespace}/jobs`)
                                .reply(200, () => {
                                    numberOfCallsToRunTest++;
                                    return {
                                        metadata: { name: 'jobName', uid: 'uid' },
                                        namespace: kubernetesConfig.kubernetesNamespace
                                    };
                                });
                        });

                        it('Create the job, then get the runs, then get the job from kubernetes and service', async () => {
                            date = new Date();
                            date.setSeconds(date.getSeconds() + 2);
                            let validBody = {
                                test_id: testId,
                                arrival_rate: 1,
                                duration: 1,
                                environment: 'test',
                                run_immediately: runImmediately,
                                cron_expression: date.getSeconds() + ' * * * * *'
                            };
                            createJobResponse = await schedulerRequestCreator.createJob(validBody, {
                                'Content-Type': 'application/json'
                            });
                            jobId = createJobResponse.body.id;

                            should(createJobResponse.status).eql(201);
                        });

                        it('Wait 4 seconds to let scheduler run the job', (done) => {
                            setTimeout(done, 4000);
                        });

                        it('Verify job was deployed as supposed to', () => {
                            let expectedRunJobsCalls = runImmediately ? 2 : 1;
                            should(numberOfCallsToRunTest).eql(expectedRunJobsCalls);
                        });

                        it('Delete job', async () => {
                            let deleteJobResponse = await schedulerRequestCreator.deleteJobFromScheduler(jobId);
                            should(deleteJobResponse.status).eql(200);
                        });
                    });
                });

                describe('Failures on get - when jobs not exist', () => {
                    it('Get on single job that not exist', async () => {
                        let getJobsFromService = await schedulerRequestCreator.getJob(uuid.v4(), {
                            'Content-Type': 'application/json'
                        });
                        getJobsFromService.statusCode.should.eql(404);
                        getJobsFromService.body.message.should.eql('Not found');
                    });
                });

                describe('Failures on stopRun - when run not exist', () => {
                    it('Stop a run of a job that not exist', async () => {
                        let jobId = uuid.v4();
                        let runId = uuid.v4();
                        nock(kubernetesConfig.kubernetesUrl).delete(`/apis/batch/v1/namespaces/${kubernetesConfig.kubernetesNamespace}/jobs/predator.${jobId}-${runId}?propagationPolicy=Foreground`)
                            .reply(404);

                        let stopRunResponse = await schedulerRequestCreator.stopRun(jobId, runId, {
                            'Content-Type': 'application/json'
                        });
                        should(stopRunResponse.statusCode).eql(404);
                    });
                });

                describe('Failures on getLogs', () => {
                    it('Gets logs should return 401', async () => {
                        nock(kubernetesConfig.kubernetesUrl).get(`/apis/batch/v1/namespaces/${kubernetesConfig.kubernetesNamespace}/jobs/predator.job_id-run_id`)
                            .reply(401, {
                                error: 'error '
                            });

                        let getLogsResponse = await schedulerRequestCreator.getLogs('job_id', 'run_id', {
                            'Content-Type': 'application/json'
                        });

                        should(getLogsResponse.status).eql(401);
                        should(getLogsResponse.headers['content-type']).eql('application/json; charset=utf-8');
                    });
                });
            });
        });
    }
});
