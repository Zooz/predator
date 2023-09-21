const should = require('should'),
    { expect } = require('chai'),
    uuid = require('uuid'),
    logger = require('../../../src/common/logger'),
    constants = require('../../../src/reports/utils/constants'),
    schedulerRequestCreator = require('./helpers/requestCreator'),
    configManagerRequestCreator = require('../configManager/helpers/requestCreator'),
    webhooksRequestCreator = require('../webhooks/helpers/requestCreator'),
    testsRequestCreator = require('../tests/helpers/requestCreator'),
    reportsRequestCreator = require('../reports/helpers/requestCreator'),
    chaosExperimentsRequestCreator = require('../chaos-experiments/helpers/requestCreator'),
    statsGenerator = require('../reports/helpers/statsGenerator'),
    nock = require('nock'),
    kubernetesConfig = require('../../../src/config/kubernetesConfig');

describe('Create job specific kubernetes tests', async function () {
    this.timeout(20000);
    let testId;

    beforeEach(() => {
        nock.cleanAll();
    });

    const jobPlatform = process.env.JOB_PLATFORM;
    if (jobPlatform.toUpperCase() === 'KUBERNETES') {
        describe('Kubernetes', () => {
            before(async () => {
                await configManagerRequestCreator.init();
                await schedulerRequestCreator.init();
                await testsRequestCreator.init();
                await webhooksRequestCreator.init();
                await reportsRequestCreator.init();
                await chaosExperimentsRequestCreator.init();

                const requestBody = require('../../testExamples/Basic_test');
                const response = await testsRequestCreator.createTest(requestBody, {});
                should(response.statusCode).eql(201);
                should(response.body).have.key('id');
                testId = response.body.id;
            });
            describe('Good requests', () => {
                let jobId;
                describe('Create two jobs, one is one time, second one is cron and get them', () => {
                    let createJobResponse;
                    let getJobsFromService;
                    let cronJobId;
                    let oneTimeJobId;

                    it('Create first job which is one time load_test', async () => {
                        nock(kubernetesConfig.kubernetesUrl).post(`/apis/batch/v1/namespaces/${kubernetesConfig.kubernetesNamespace}/jobs`)
                            .reply(200, {
                                metadata: { name: 'jobName', uid: 'uid' },
                                namespace: kubernetesConfig.kubernetesNamespace
                            });

                        const jobBody = {
                            test_id: testId,
                            arrival_rate: 1,
                            duration: 1,
                            environment: 'test',
                            run_immediately: true,
                            type: 'load_test'
                        };

                        createJobResponse = await schedulerRequestCreator.createJob(jobBody, {
                            'Content-Type': 'application/json'
                        });

                        should(createJobResponse.status).eql(201);
                        oneTimeJobId = createJobResponse.body.id;
                    });

                    it('Create second job which is cron functional_test', async () => {
                        const jobBody = {
                            test_id: testId,
                            arrival_count: 1,
                            duration: 1,
                            environment: 'test',
                            run_immediately: false,
                            cron_expression: '* 10 * * * *',
                            type: 'functional_test'
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

                        const relevantJobs = getJobsFromService = getJobsFromService.body.filter(job => job.id === cronJobId || job.id === oneTimeJobId);
                        should(relevantJobs.length).eql(1);
                        should(relevantJobs[0].id).eql(cronJobId);
                    });

                    it('Get the jobs, with one_time query param, two jobs should be returned', async () => {
                        getJobsFromService = await schedulerRequestCreator.getJobs({
                            'Content-Type': 'application/json'
                        }, true);

                        should(getJobsFromService.status).eql(200);

                        const relevantJobs = getJobsFromService = getJobsFromService.body.filter(job => job.id === cronJobId || job.id === oneTimeJobId);
                        should(relevantJobs.length).eql(2);
                        should(relevantJobs).containEql({
                            id: oneTimeJobId,
                            test_id: testId,
                            arrival_rate: 1,
                            duration: 1,
                            environment: 'test',
                            enabled: true,
                            type: 'load_test'
                        });

                        should(relevantJobs).containEql({
                            id: cronJobId,
                            test_id: testId,
                            cron_expression: '* 10 * * * *',
                            arrival_count: 1,
                            duration: 1,
                            environment: 'test',
                            enabled: true,
                            type: 'functional_test'
                        });
                    });

                    it('Delete jobs', async () => {
                        await schedulerRequestCreator.deleteJobFromScheduler(cronJobId);
                        await schedulerRequestCreator.deleteJobFromScheduler(oneTimeJobId);
                    });
                });

                describe('Create two jobs, one is one time, second one is cron and get them with experiments', () => {
                    let createJobResponse;
                    let chaosExperimentId;
                    let getJobsFromService;
                    let cronJobId;
                    let oneTimeJobId;

                    before(async () => {
                        const chaosExperiment = chaosExperimentsRequestCreator.generateRawChaosExperiment(uuid.v4());
                        const chaosExperimentResponse = await chaosExperimentsRequestCreator.createChaosExperiment(chaosExperiment, { 'Content-Type': 'application/json' });
                        chaosExperimentId = chaosExperimentResponse.body.id;
                    });

                    it('Create first job which is one time load_test', async () => {
                        nock(kubernetesConfig.kubernetesUrl).post(`/apis/batch/v1/namespaces/${kubernetesConfig.kubernetesNamespace}/jobs`)
                            .reply(200, {
                                metadata: { name: 'jobName', uid: 'uid' },
                                namespace: kubernetesConfig.kubernetesNamespace
                            });

                        const jobBody = {
                            test_id: testId,
                            arrival_rate: 1,
                            duration: 1,
                            environment: 'test',
                            run_immediately: true,
                            type: 'load_test',
                            experiments: [
                                {
                                    experiment_id: chaosExperimentId,
                                    start_after: 5000
                                }
                            ]
                        };

                        createJobResponse = await schedulerRequestCreator.createJob(jobBody, {
                            'Content-Type': 'application/json'
                        });

                        should(createJobResponse.status).eql(201);
                        oneTimeJobId = createJobResponse.body.id;
                    });

                    it('Create second job which is cron functional_test', async () => {
                        const jobBody = {
                            test_id: testId,
                            arrival_count: 1,
                            duration: 1,
                            environment: 'test',
                            run_immediately: false,
                            cron_expression: '* 10 * * * *',
                            type: 'functional_test',
                            experiments: [
                                {
                                    experiment_id: chaosExperimentId,
                                    start_after: 5000
                                }
                            ]
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

                        const relevantJobs = getJobsFromService = getJobsFromService.body.filter(job => job.id === cronJobId || job.id === oneTimeJobId);
                        should(relevantJobs.length).eql(1);
                        should(relevantJobs[0].id).eql(cronJobId);
                    });

                    it('Get the jobs, with one_time query param, two jobs should be returned', async () => {
                        getJobsFromService = await schedulerRequestCreator.getJobs({
                            'Content-Type': 'application/json'
                        }, true);

                        should(getJobsFromService.status).eql(200);

                        const relevantJobs = getJobsFromService = getJobsFromService.body.filter(job => job.id === cronJobId || job.id === oneTimeJobId);
                        should(relevantJobs.length).eql(2);
                        should(relevantJobs).containEql({
                            id: oneTimeJobId,
                            test_id: testId,
                            arrival_rate: 1,
                            duration: 1,
                            environment: 'test',
                            enabled: true,
                            type: 'load_test',
                            experiments: [
                                {
                                    experiment_id: '1234',
                                    start_after: 5000
                                }
                            ]
                        });

                        should(relevantJobs).containEql({
                            id: cronJobId,
                            test_id: testId,
                            cron_expression: '* 10 * * * *',
                            arrival_count: 1,
                            duration: 1,
                            environment: 'test',
                            enabled: true,
                            type: 'functional_test',
                            experiments: [
                                {
                                    experiment_id: '1234',
                                    start_after: 5000
                                }
                            ]
                        });
                    });

                    it('Delete jobs', async () => {
                        await schedulerRequestCreator.deleteJobFromScheduler(cronJobId);
                        await schedulerRequestCreator.deleteJobFromScheduler(oneTimeJobId);
                    });
                });

                describe('report status on k8s api failure', function() {
                    it('should return a report with status failed', async function() {
                        nock(kubernetesConfig.kubernetesUrl).post(`/apis/batch/v1/namespaces/${kubernetesConfig.kubernetesNamespace}/jobs`)
                            .reply(500, {
                                metadata: { name: 'jobName', uid: 'uid' },
                                namespace: kubernetesConfig.kubernetesNamespace
                            });

                        const jobBody = {
                            test_id: testId,
                            arrival_rate: 1,
                            duration: 1,
                            environment: 'test',
                            run_immediately: true,
                            type: 'load_test'
                        };

                        const createJobResponse = await schedulerRequestCreator.createJob(jobBody, {
                            'Content-Type': 'application/json'
                        });

                        should(createJobResponse.status).eql(500);

                        const getReportByTestIdResponse = await reportsRequestCreator.getReports(testId);
                        expect(getReportByTestIdResponse.status).to.be.eql(200);
                        const lastReport = getReportByTestIdResponse.body[0];
                        expect(lastReport.status).to.be.equal(constants.REPORT_FAILED_STATUS);
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
                        const jobBody = {
                            test_id: testId,
                            arrival_rate: 1,
                            duration: 1,
                            environment: 'test',
                            run_immediately: false,
                            cron_expression: '* * * * * *',
                            enabled: false,
                            type: 'load_test'
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

                    it('Wait 4 seconds to let scheduler run the job', async () => {
                        await sleep(4000);
                    });

                    it('Verify job did not run', () => {
                        should(numberOfCallsToRunTest).eql(0);
                    });

                    it('Enable job', async () => {
                        await schedulerRequestCreator.updateJob(jobId, { enabled: true }, {
                            'Content-Type': 'application/json'
                        });
                    });

                    it('Get the job and verify it is enabled', async () => {
                        jobId = createJobResponse.body.id;
                        getJobsFromService = await schedulerRequestCreator.getJob(jobId, {
                            'Content-Type': 'application/json'
                        });

                        should(getJobsFromService.status).eql(200);
                        should(getJobsFromService.body.enabled).eql(true);
                    });

                    it('Wait 4 seconds to let scheduler run the job', async () => {
                        await sleep(4000);
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
                        const validBody = {
                            test_id: testId,
                            arrival_rate: 1,
                            type: 'load_test',
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
                            max_virtual_users: 500,
                            type: 'load_test'
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
                        nock(kubernetesConfig.kubernetesUrl).get(`/apis/batch/v1/namespaces/${kubernetesConfig.kubernetesNamespace}/jobs/predator.${createJobResponse.body.report_id}`)
                            .reply(200, {
                                spec: { selector: { matchLabels: { 'controller-uid': 'uid' } } }
                            });

                        nock(kubernetesConfig.kubernetesUrl).get(`/api/v1/namespaces/${kubernetesConfig.kubernetesNamespace}/pods?labelSelector=controller-uid=uid`)
                            .reply(200, {
                                items: [{ metadata: { name: 'podA' } }, { metadata: { name: 'podB' } }]
                            });

                        nock(kubernetesConfig.kubernetesUrl).get(`/api/v1/namespaces/${kubernetesConfig.kubernetesNamespace}/pods/podA/log?container=predator-runner`)
                            .reply(200, {
                                items: [{ content: 'log' }]
                            });

                        nock(kubernetesConfig.kubernetesUrl).get(`/api/v1/namespaces/${kubernetesConfig.kubernetesNamespace}/pods/podB/log?container=predator-runner`)
                            .reply(200, {
                                items: [{ content: 'log' }]
                            });

                        const getLogsResponse = await schedulerRequestCreator.getLogs(createJobResponse.body.id, createJobResponse.body.report_id, {
                            'Content-Type': 'application/json'
                        });

                        should(getLogsResponse.status).eql(200);
                        should(getLogsResponse.headers['content-type']).eql('application/zip');
                    });

                    it('Stop run', async () => {
                        nock(kubernetesConfig.kubernetesUrl).delete(`/apis/batch/v1/namespaces/${kubernetesConfig.kubernetesNamespace}/jobs/predator.${createJobResponse.body.report_id}?propagationPolicy=Foreground`)
                            .reply(200);

                        const stopRunResponse = await schedulerRequestCreator.stopRun(createJobResponse.body.id, createJobResponse.body.report_id, {
                            'Content-Type': 'application/json'
                        });

                        should(stopRunResponse.status).eql(204);
                    });

                    it('Delete job', async () => {
                        const deleteJobResponse = await schedulerRequestCreator.deleteJobFromScheduler(jobId);
                        should(deleteJobResponse.status).eql(204);

                        jobId = createJobResponse.body.id;
                        getJobsFromService = await schedulerRequestCreator.getJob(jobId, {
                            'Content-Type': 'application/json'
                        });

                        should(getJobsFromService.status).eql(404);
                    });
                });

                describe('Create one time job with parallelism and custom runner definition, should create job with the right parameters and run it, finally stop and delete it', () => {
                    let createJobResponse;
                    let getJobsFromService;
                    let expectedResult;
                    it('Create the job', async () => {
                        await configManagerRequestCreator.updateConfig({
                            custom_runner_definition: {
                                spec: {
                                    template: {
                                        metadata: {
                                            annotations: {
                                                'traffic.sidecar.istio.io/excludeOutboundPorts': '8060'
                                            }
                                        }
                                    }
                                }
                            }
                        });

                        const validBody = {
                            test_id: testId,
                            arrival_rate: 100,
                            ramp_to: 150,
                            type: 'load_test',
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
                            parallelism: 7,
                            type: 'load_test'
                        };
                        let actualJobEnvVars = {};
                        let actualAnnotations = {};
                        nock(kubernetesConfig.kubernetesUrl).post(`/apis/batch/v1/namespaces/${kubernetesConfig.kubernetesNamespace}/jobs`, body => {
                            actualAnnotations = body.spec.template.metadata.annotations;
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

                        const rampTo = actualJobEnvVars.find(env => env.name === 'RAMP_TO');
                        should.exists(rampTo);

                        const arrivalRate = actualJobEnvVars.find(env => env.name === 'ARRIVAL_RATE');
                        should.exists(arrivalRate);

                        const maxVirtualUsers = actualJobEnvVars.find(env => env.name === 'MAX_VIRTUAL_USERS');
                        should.exists(maxVirtualUsers);

                        should(rampTo.value).eql('22');
                        should(arrivalRate.value).eql('15');
                        should(maxVirtualUsers.value).eql('29');
                        should(actualAnnotations).eql({ 'traffic.sidecar.istio.io/excludeOutboundPorts': '8060' });
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
                        nock(kubernetesConfig.kubernetesUrl).delete(`/apis/batch/v1/namespaces/${kubernetesConfig.kubernetesNamespace}/jobs/predator.${createJobResponse.body.report_id}?propagationPolicy=Foreground`)
                            .reply(200);

                        const stopRunResponse = await schedulerRequestCreator.stopRun(createJobResponse.body.id, createJobResponse.body.report_id, {
                            'Content-Type': 'application/json'
                        });

                        should(stopRunResponse.status).eql(204);
                    });

                    it('Delete job', async () => {
                        const deleteJobResponse = await schedulerRequestCreator.deleteJobFromScheduler(jobId);
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
                                status: {
                                    containerStatuses: [{
                                        name: 'predator-runner',
                                        state: { terminated: { finishedAt: '2020' } }
                                    }, {
                                        name: 'podB',
                                        state: {}
                                    }]
                                }

                            });

                        nock(kubernetesConfig.kubernetesUrl).get(`/api/v1/namespaces/${kubernetesConfig.kubernetesNamespace}/pods/podB`)
                            .reply(200, {
                                metadata: { labels: { 'job-name': 'someJob.job' } },
                                status: {
                                    containerStatuses: [{
                                        name: 'podC',
                                        state: { terminated: { finishedAt: '2020' } }
                                    }, {
                                        name: 'podD',
                                        state: {}
                                    }]
                                }

                            });

                        nock(kubernetesConfig.kubernetesUrl).delete(`/apis/batch/v1/namespaces/${kubernetesConfig.kubernetesNamespace}/jobs/predator.job?propagationPolicy=Foreground`)
                            .reply(200);

                        const deleteJobResponse = await schedulerRequestCreator.deletePredatorRunnerContainers();
                        should(deleteJobResponse.status).eql(200);
                        should(deleteJobResponse.body.deleted).eql(1);
                    });
                });

                describe('Create one time job with slack webhook and run it, assert that webhook was sent for started phase', () => {
                    let createJobResponse;
                    let getJobsFromService;
                    let reportId;
                    let expectedResult;

                    it('Create the job', async () => {
                        const webhookBody = {
                            name: 'mickeys webhook',
                            url: 'http://www.abcde.com/mickey',
                            events: [
                                'started',
                                'api_failure',
                                'aborted',
                                'failed',
                                'finished',
                                'benchmark_passed',
                                'benchmark_failed'
                            ],
                            format_type: 'json',
                            global: false
                        };

                        const webhook = await webhooksRequestCreator.createWebhook(webhookBody);
                        should(webhook.status).eql(201);

                        const validBody = {
                            test_id: testId,
                            arrival_rate: 100,
                            ramp_to: 150,
                            type: 'load_test',
                            max_virtual_users: 200,
                            duration: 60,
                            parallelism: 1,
                            environment: 'test',
                            run_immediately: true,
                            webhooks: [webhook.body.id]
                        };

                        expectedResult = {
                            environment: 'test',
                            test_id: testId,
                            arrival_rate: 100,
                            ramp_to: 150,
                            duration: 60,
                            parallelism: 1,
                            type: 'load_test',
                            webhooks: [webhook.body.id]
                        };

                        nock(kubernetesConfig.kubernetesUrl).post(`/apis/batch/v1/namespaces/${kubernetesConfig.kubernetesNamespace}/jobs`, body => {
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

                        reportId = createJobResponse.body.report_id;
                    });

                    it('Get the job', async () => {
                        jobId = createJobResponse.body.id;
                        getJobsFromService = await schedulerRequestCreator.getJob(jobId, {
                            'Content-Type': 'application/json'
                        });

                        should(getJobsFromService.status).eql(200);
                        should(getJobsFromService.body).containEql(expectedResult);
                    });

                    it('Runner posts started stats and webhook is sent', async () => {
                        const webhookScope = nock('http://www.abcde.com').post('/mickey')
                            .reply(201, 'ok');

                        const runnerId = uuid.v4();

                        const runnerSubscriptionResponse = await reportsRequestCreator.subscribeRunnerToReport(testId, reportId, runnerId);
                        expect(runnerSubscriptionResponse.status).to.be.equal(204);

                        const phaseStartedStatsResponse = await reportsRequestCreator.postStats(testId, reportId, statsGenerator.generateStats('started_phase', runnerId));
                        should(phaseStartedStatsResponse.statusCode).be.eql(204);

                        // wait for webhook to be sent
                        await sleep(4000);

                        // assert webhook is sent
                        webhookScope.done();
                    });
                });

                describe('Create one time job with global, json webhook and run it, assert that webhook was sent for started phase', () => {
                    let createJobResponse;
                    let getJobsFromService;
                    let expectedResult;
                    let reportId;

                    it('Create the job', async () => {
                        const webhookBody = {
                            name: 'nullys webhook',
                            url: 'http://www.global.com/nully',
                            events: [
                                'started',
                                'api_failure',
                                'aborted',
                                'failed',
                                'finished'
                            ],
                            format_type: 'json',
                            global: true
                        };

                        const webhook = await webhooksRequestCreator.createWebhook(webhookBody);
                        should(webhook.status).eql(201);

                        const validBody = {
                            test_id: testId,
                            arrival_rate: 100,
                            ramp_to: 150,
                            type: 'load_test',
                            max_virtual_users: 200,
                            duration: 60,
                            parallelism: 1,
                            environment: 'test',
                            run_immediately: true,
                            webhooks: []
                        };

                        expectedResult = {
                            environment: 'test',
                            test_id: testId,
                            arrival_rate: 100,
                            ramp_to: 150,
                            duration: 60,
                            parallelism: 1,
                            type: 'load_test'
                        };

                        nock(kubernetesConfig.kubernetesUrl).post(`/apis/batch/v1/namespaces/${kubernetesConfig.kubernetesNamespace}/jobs`, body => {
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

                        reportId = createJobResponse.body.report_id.toString();
                    });

                    it('Get the job', async () => {
                        jobId = createJobResponse.body.id;
                        getJobsFromService = await schedulerRequestCreator.getJob(jobId, {
                            'Content-Type': 'application/json'
                        });

                        should(getJobsFromService.status).eql(200);
                        should(getJobsFromService.body).containEql(expectedResult);
                    });

                    it('Runner posts started stats and webhook is sent', async () => {
                        const webhookScope = nock('http://www.global.com').post('/nully')
                            .reply(201, 'ok');

                        const runnerId = uuid.v4();

                        const runnerSubscriptionResponse = await reportsRequestCreator.subscribeRunnerToReport(testId, reportId, runnerId);
                        expect(runnerSubscriptionResponse.status).to.be.equal(204);

                        const phaseStartedStatsResponse = await reportsRequestCreator.postStats(testId, reportId, statsGenerator.generateStats('started_phase', runnerId));
                        should(phaseStartedStatsResponse.statusCode).be.eql(204);

                        // wait for webhook to be sent
                        await sleep(4000);

                        // assert webhook is sent
                        webhookScope.done();
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
                            const validBody = {
                                test_id: testId,
                                arrival_rate: 1,
                                type: 'load_test',
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

                        it('Wait 4 seconds to let scheduler run the job', async () => {
                            await sleep(4000);
                        });

                        it('Verify job was deployed as supposed to', () => {
                            const expectedRunJobsCalls = runImmediately ? 2 : 1;
                            should(numberOfCallsToRunTest).eql(expectedRunJobsCalls);
                        });

                        it('Delete job', async () => {
                            const deleteJobResponse = await schedulerRequestCreator.deleteJobFromScheduler(jobId);
                            should(deleteJobResponse.status).eql(200);
                        });
                    });
                });

                describe('Failures on get - when jobs not exist', () => {
                    it('Get on single job that not exist', async () => {
                        const getJobsFromService = await schedulerRequestCreator.getJob(uuid.v4(), {
                            'Content-Type': 'application/json'
                        });
                        getJobsFromService.statusCode.should.eql(404);
                        getJobsFromService.body.message.should.eql('Not found');
                    });
                });

                describe('Failures on stopRun - when run not exist', () => {
                    it('Stop a run of a job that not exist', async () => {
                        const jobId = uuid.v4();
                        const reportId = uuid.v4();
                        nock(kubernetesConfig.kubernetesUrl).delete(`/apis/batch/v1/namespaces/${kubernetesConfig.kubernetesNamespace}/jobs/predator.${reportId}?propagationPolicy=Foreground`)
                            .reply(404);

                        const stopRunResponse = await schedulerRequestCreator.stopRun(jobId, reportId, {
                            'Content-Type': 'application/json'
                        });
                        should(stopRunResponse.statusCode).eql(404);
                    });
                });

                describe('Failures on getLogs', () => {
                    let jobId, createJobResponse;
                    before(async function() {
                        nock(kubernetesConfig.kubernetesUrl).post(`/apis/batch/v1/namespaces/${kubernetesConfig.kubernetesNamespace}/jobs`)
                            .reply(200, {
                                metadata: { name: 'jobName', uid: 'uid' },
                                namespace: kubernetesConfig.kubernetesNamespace
                            });

                        const jobBody = {
                            test_id: testId,
                            arrival_rate: 1,
                            duration: 1,
                            environment: 'test',
                            run_immediately: true,
                            type: 'load_test'
                        };

                        createJobResponse = await schedulerRequestCreator.createJob(jobBody, {
                            'Content-Type': 'application/json'
                        });

                        should(createJobResponse.status).eql(201);
                        jobId = createJobResponse.body.id;
                    });
                    it('Gets logs should return 401', async () => {
                        nock(kubernetesConfig.kubernetesUrl).get(`/apis/batch/v1/namespaces/${kubernetesConfig.kubernetesNamespace}/jobs/predator.report_id`)
                            .reply(401, {
                                error: 'error '
                            });

                        const getLogsResponse = await schedulerRequestCreator.getLogs(jobId, 'report_id', {
                            'Content-Type': 'application/json'
                        });

                        should(getLogsResponse.status).eql(401);
                        should(getLogsResponse.headers['content-type']).eql('application/json; charset=utf-8');
                    });
                });
            });
            describe('Bad requests', () => {
                describe('Create a job with experiment that does not exist', () => {
                    it.only('should fail job creation', async () => {
                        nock(kubernetesConfig.kubernetesUrl).post(`/apis/batch/v1/namespaces/${kubernetesConfig.kubernetesNamespace}/jobs`)
                            .reply(200, {
                                metadata: { name: 'jobName', uid: 'uid' },
                                namespace: kubernetesConfig.kubernetesNamespace
                            });

                        const jobBody = {
                            test_id: testId,
                            arrival_rate: 1,
                            duration: 1,
                            environment: 'test',
                            run_immediately: true,
                            type: 'load_test',
                            experiments: [
                                {
                                    experiment_id: uuid.v4(),
                                    start_after: 5000
                                }
                            ]
                        };

                        const createJobResponse = await schedulerRequestCreator.createJob(jobBody, {
                            'Content-Type': 'application/json'
                        });

                        should(createJobResponse.status).eql(400);
                        should(createJobResponse.body).eql('One or more chaos experiments are not configured. Job can not be created');
                    });
                });
            });
        });
    }
});

const sleep = (time) => {
    logger.info(`sleeping for ${time}ms`);
    return new Promise((resolve) => {
        setTimeout(resolve, time);
    });
};
