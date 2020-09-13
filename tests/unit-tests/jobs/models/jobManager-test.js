'use strict';

const should = require('should'),
    rewire = require('rewire'),
    sinon = require('sinon'),
    databaseConnector = require('../../../../src/jobs/models/database/databaseConnector'),
    logger = require('../../../../src/common/logger'),
    uuid = require('uuid'),
    jobConnector = require('../../../../src/jobs/models/kubernetes/jobConnector'),
    dockerHubConnector = require('../../../../src/jobs/models/dockerHubConnector'),
    jobTemplate = require('../../../../src/jobs/models/kubernetes/jobTemplate'),
    webhooksManager = require('../../../../src/webhooks/models/webhookManager'),
    config = require('../../../../src/common/consts').CONFIG;

let manager;

const TEST_ID = '5a9eee73-cf56-47aa-ac77-fad59e961aaa';
const JOB_ID = '5a9eee73-cf56-47aa-ac77-fad59e961aaf';

describe('Manager tests', function () {
    let sandbox;
    let databaseConnectorInsertStub;
    let loggerErrorStub;
    let loggerInfoStub;
    let jobConnectorRunJobStub;
    let jobStopRunStub;
    let jobGetLogsStub;
    let jobDeleteContainerStub;
    let uuidStub;
    let databaseConnectorDeleteStub;
    let databaseConnectorGetStub;
    let databaseConnectorGetSingleJobStub;
    let databaseConnectorUpdateJobStub;
    let dockerHubConnectorGetMostRecentTagStub;
    let jobTemplateCreateJobRequestStub;
    let getConfigValueStub;

    let webhooksManagerGetWebhook;

    before(() => {
        sandbox = sinon.sandbox.create();

        databaseConnectorInsertStub = sandbox.stub(databaseConnector, 'insertJob');
        databaseConnectorGetStub = sandbox.stub(databaseConnector, 'getJobs');
        databaseConnectorGetSingleJobStub = sandbox.stub(databaseConnector, 'getJob');
        databaseConnectorDeleteStub = sandbox.stub(databaseConnector, 'deleteJob');
        databaseConnectorUpdateJobStub = sandbox.stub(databaseConnector, 'updateJob');

        webhooksManagerGetWebhook = sandbox.stub(webhooksManager, 'getWebhook');

        jobGetLogsStub = sandbox.stub(jobConnector, 'getLogs');
        jobDeleteContainerStub = sandbox.stub(jobConnector, 'deleteAllContainers');
        jobStopRunStub = sandbox.stub(jobConnector, 'stopRun');

        loggerErrorStub = sandbox.stub(logger, 'error');
        loggerInfoStub = sandbox.stub(logger, 'info');

        jobConnectorRunJobStub = sandbox.stub(jobConnector, 'runJob');

        dockerHubConnectorGetMostRecentTagStub = sandbox.stub(dockerHubConnector, 'getMostRecentRunnerTag');
        uuidStub = sandbox.stub(uuid, 'v4');

        jobTemplateCreateJobRequestStub = sandbox.spy(jobTemplate, 'createJobRequest');
        getConfigValueStub = sandbox.stub();

        manager = rewire('../../../../src/jobs/models/jobManager');

        manager.__set__('configHandler', {
            getConfig: () => {
                return {
                    job_platform: 'KUBERNETES',
                    concurrency_limit: 100,
                    delay_runner_ms: 0
                };
            },
            getConfigValue: getConfigValueStub
        });
        getConfigValueStub.withArgs(config.JOB_PLATFORM).returns('KUBERNETES');
    });

    beforeEach(async () => {
        await manager.init();
        sandbox.resetHistory();
    });

    after(() => {
        sandbox.restore();
    });

    describe('Reload cron jobs', function () {
        before(() => {
            dockerHubConnectorGetMostRecentTagStub.resolves();
        });

        it('databaseConnector connector returns an empty array', async () => {
            databaseConnectorGetStub.resolves([]);
            await manager.reloadCronJobs();
            manager.__get__('cronJobs').should.eql({});
        });

        it('databaseConnector connector returns an array with job with no schedules', async () => {
            databaseConnectorGetStub.resolves([{ cron_expression: null }]);
            await manager.reloadCronJobs();
            manager.__get__('cronJobs').should.eql({});
        });

        describe('databaseConnector connector returns an array with job with schedules, and job exist and can be run', function () {
            it('Verify job added', async function () {
                const jobBodyWithCron = {
                    test_id: TEST_ID,
                    id: TEST_ID,
                    arrival_rate: 1,
                    duration: 1,
                    cron_expression: '* * * * * *',
                    run_immediately: true,
                    emails: ['dina@niv.eli'],
                    environment: 'test',
                    ramp_to: '1',
                    webhooks: []
                };
                databaseConnectorGetStub.resolves([jobBodyWithCron]);
                await manager.reloadCronJobs();
                manager.__get__('cronJobs').should.have.key('5a9eee73-cf56-47aa-ac77-fad59e961aaa');
            });

            it('Verify cron was invoked more than once', function (done) {
                this.timeout(5000);
                setTimeout(async () => {
                    try {
                        await manager.deleteJob('5a9eee73-cf56-47aa-ac77-fad59e961aaa');
                        loggerErrorStub.callCount.should.eql(0);
                        jobConnectorRunJobStub.callCount.should.be.aboveOrEqual(2);
                        done();
                    } catch (error) {
                        done(new Error(error));
                    }
                }, 3000);
            });
        });
    });

    describe('schedule Finished Containers Cleanup', function () {
        it('Interval is set to 0, no automatic cleanup is scheduled', (done) => {
            getConfigValueStub.withArgs(config.INTERVAL_CLEANUP_FINISHED_CONTAINERS_MS).returns(0);
            jobDeleteContainerStub.resolves({deleted: 10});
            manager.scheduleFinishedContainersCleanup();

            setTimeout(() => {
                jobDeleteContainerStub.callCount.should.eql(0);
                done();
            }, 1000);
        });

        it('Interval is set to 100, automatic cleanup is scheduled', (done) => {
            getConfigValueStub.withArgs(config.INTERVAL_CLEANUP_FINISHED_CONTAINERS_MS).returns(100);
            jobDeleteContainerStub.resolves({deleted: 10});
            let intervalObject;
            manager.scheduleFinishedContainersCleanup()
                .then((interval) => {
                    intervalObject = interval;
                });

            setTimeout(() => {
                jobDeleteContainerStub.callCount.should.be.greaterThanOrEqual(5);
                clearInterval(intervalObject);
                done();
            }, 1000);
        });
    });

    describe('Create new job', function () {
        before(() => {
            manager.__set__('configHandler', {
                getConfig: () => {
                    return {
                        job_platform: 'KUBERNETES',
                        base_url: '',
                        internal_address: 'localhost:80',
                        delay_runner_ms: 0
                    };
                },
                getConfigValue: getConfigValueStub
            });
            uuidStub.returns('5a9eee73-cf56-47aa-ac77-fad59e961aaf');
        });

        it('Simple request with custom env vars, should save new job to databaseConnector, deploy the job and return the job id and the job configuration', async () => {
            const webhooks = [
                {
                    id: '5a9eee73-cf56-47aa-ac77-fad59e961aaa',
                    name: 'dina',
                    url: 'dina@mail.com',
                    global: false
                },
                {
                    id: '5a9eee73-cf56-47aa-ac77-fad59e961aab',
                    name: 'niv',
                    url: 'niv@mail.com',
                    global: false
                }
            ];
            const jobBodyWithCustomEnvVars = {
                test_id: TEST_ID,
                arrival_rate: 1,
                duration: 1,
                run_immediately: true,
                type: 'load_test',
                emails: ['dina@niv.eli'],
                environment: 'test',
                webhooks: webhooks.map(({ id }) => id),
                custom_env_vars: { KEY1: 'A', KEY2: 'B' },
                max_virtual_users: 100
            };
            jobConnectorRunJobStub.resolves({ id: 'run_id' });
            databaseConnectorInsertStub.resolves({ success: 'success' });
            let expectedResult = {
                id: '5a9eee73-cf56-47aa-ac77-fad59e961aaf',
                test_id: '5a9eee73-cf56-47aa-ac77-fad59e961aaa',
                environment: 'test',
                emails: ['dina@niv.eli'],
                webhooks: webhooks.map(({ id }) => id),
                arrival_rate: 1,
                duration: 1,
                max_virtual_users: 100,
                enabled: true,
                custom_env_vars: {
                    KEY1: 'A',
                    KEY2: 'B'
                }
            };
            webhooks.map(webhook => webhooksManagerGetWebhook.withArgs(webhook.id).resolves(webhook));
            let jobResponse = await manager.createJob(jobBodyWithCustomEnvVars);
            jobResponse.should.containEql(expectedResult);
            databaseConnectorInsertStub.callCount.should.eql(1);
            jobConnectorRunJobStub.callCount.should.eql(1);
            jobTemplateCreateJobRequestStub.args[0][3].should.containEql({
                JOB_ID: '5a9eee73-cf56-47aa-ac77-fad59e961aaf',
                ENVIRONMENT: 'test',
                TEST_ID: '5a9eee73-cf56-47aa-ac77-fad59e961aaa',
                PREDATOR_URL: 'localhost:80',
                JOB_TYPE: 'load_test',
                ARRIVAL_RATE: '1',
                DURATION: '1',
                EMAILS: 'dina@niv.eli',
                WEBHOOKS: webhooks.map(({ url }) => url).join(';'),
                CUSTOM_KEY1: 'A',
                CUSTOM_KEY2: 'B'
            });

            jobTemplateCreateJobRequestStub.args[0][3].should.have.key('RUN_ID');
        });

        it('Simple request, should save new job to databaseConnector, deploy the job and return the job id and the job configuration', async () => {
            const webhooks = [
                {
                    id: '5a9eee73-cf56-47aa-ac77-fad59e961aaa',
                    name: 'dina',
                    url: 'dina@mail.com',
                    global: false
                },
                {
                    id: '5a9eee73-cf56-47aa-ac77-fad59e961aab',
                    name: 'niv',
                    url: 'niv@mail.com',
                    global: false
                }
            ];
            const jobBodyWithoutCron = {
                test_id: TEST_ID,
                arrival_rate: 1,
                duration: 1,
                run_immediately: true,
                emails: ['dina@niv.eli'],
                environment: 'test',
                ramp_to: '1',
                webhooks: webhooks.map(({ id }) => id)
            };
            jobConnectorRunJobStub.resolves({});
            databaseConnectorInsertStub.resolves({ success: 'success' });
            let expectedResult = {
                id: '5a9eee73-cf56-47aa-ac77-fad59e961aaf',
                ramp_to: '1',
                test_id: '5a9eee73-cf56-47aa-ac77-fad59e961aaa',
                environment: 'test',
                emails: ['dina@niv.eli'],
                webhooks: webhooks.map(({ id }) => id),
                arrival_rate: 1,
                duration: 1
            };
            webhooks.map(webhook => webhooksManagerGetWebhook.withArgs(webhook.id).resolves(webhook));

            let jobResponse = await manager.createJob(jobBodyWithoutCron);
            jobResponse.should.containEql(expectedResult);
            databaseConnectorInsertStub.callCount.should.eql(1);
            jobConnectorRunJobStub.callCount.should.eql(1);
        });

        it('Simple request, with parallelism, should save new job to databaseConnector, deploy the job and return the job id and the job configuration', async () => {
            const webhooks = [
                {
                    id: '5a9eee73-cf56-47aa-ac77-fad59e961aaa',
                    name: 'dina',
                    url: 'dina@mail.com',
                    global: false
                },
                {
                    id: '5a9eee73-cf56-47aa-ac77-fad59e961aab',
                    name: 'niv',
                    url: 'niv@mail.com',
                    global: false
                }
            ];
            const jobBodyWithParallelismThatSplitsNicely = {
                test_id: TEST_ID,
                arrival_rate: 99,
                duration: 1,
                run_immediately: true,
                emails: ['dina@niv.eli'],
                environment: 'test',
                ramp_to: '150',
                parallelism: 3,
                webhooks: webhooks.map(({ id }) => id),
                max_virtual_users: 198
            };
            jobConnectorRunJobStub.resolves({});
            databaseConnectorInsertStub.resolves({ success: 'success' });
            let expectedResult = {
                id: '5a9eee73-cf56-47aa-ac77-fad59e961aaf',
                ramp_to: '150',
                test_id: '5a9eee73-cf56-47aa-ac77-fad59e961aaa',
                environment: 'test',
                emails: ['dina@niv.eli'],
                parallelism: 3,
                webhooks: webhooks.map(({ id }) => id),
                arrival_rate: 99,
                duration: 1,
                max_virtual_users: 198
            };
            webhooks.map(webhook => webhooksManagerGetWebhook.withArgs(webhook.id).resolves(webhook));

            let jobResponse = await manager.createJob(jobBodyWithParallelismThatSplitsNicely);
            jobResponse.should.containEql(expectedResult);
            databaseConnectorInsertStub.callCount.should.eql(1);
            jobConnectorRunJobStub.callCount.should.eql(1);

            should(jobConnectorRunJobStub.args[0][0].spec.parallelism).eql(3);

            let rampTo = jobConnectorRunJobStub.args[0][0].spec.template.spec.containers[0].env.find(env => env.name === 'RAMP_TO');
            should.exists(rampTo);

            let arrivalRate = jobConnectorRunJobStub.args[0][0].spec.template.spec.containers[0].env.find(env => env.name === 'ARRIVAL_RATE');
            should.exists(arrivalRate);

            let maxVirtualUsers = jobConnectorRunJobStub.args[0][0].spec.template.spec.containers[0].env.find(env => env.name === 'MAX_VIRTUAL_USERS');
            should.exists(maxVirtualUsers);

            should(rampTo.value).eql('50');
            should(arrivalRate.value).eql('33');
            should(maxVirtualUsers.value).eql('66');
        });

        it('Simple request, with parallelism, and arrival rate splits with decimal point, should round up', async () => {
            const webhooks = [
                {
                    id: '5a9eee73-cf56-47aa-ac77-fad59e961aaa',
                    name: 'dina',
                    url: 'dina@mail.com',
                    global: false
                },
                {
                    id: '5a9eee73-cf56-47aa-ac77-fad59e961aab',
                    name: 'niv',
                    url: 'niv@mail.com',
                    global: false
                }
            ];
            const jobBodyWithParallelismThatSplitsWithDecimal = {
                test_id: TEST_ID,
                arrival_rate: 99,
                duration: 1,
                run_immediately: true,
                emails: ['dina@niv.eli'],
                environment: 'test',
                ramp_to: '150',
                parallelism: 20,
                webhooks: webhooks.map(({ id }) => id),
                max_virtual_users: 510
            };
            jobConnectorRunJobStub.resolves({});
            databaseConnectorInsertStub.resolves({ success: 'success' });
            let expectedResult = {
                id: '5a9eee73-cf56-47aa-ac77-fad59e961aaf',
                ramp_to: '150',
                test_id: '5a9eee73-cf56-47aa-ac77-fad59e961aaa',
                environment: 'test',
                emails: ['dina@niv.eli'],
                parallelism: 20,
                webhooks: webhooks.map(({ id }) => id),
                arrival_rate: 99,
                duration: 1,
                max_virtual_users: 510
            };
            webhooks.map(webhook => webhooksManagerGetWebhook.withArgs(webhook.id).resolves(webhook));

            let jobResponse = await manager.createJob(jobBodyWithParallelismThatSplitsWithDecimal);
            jobResponse.should.containEql(expectedResult);
            databaseConnectorInsertStub.callCount.should.eql(1);
            jobConnectorRunJobStub.callCount.should.eql(1);

            should(jobConnectorRunJobStub.args[0][0].spec.parallelism).eql(20);

            let rampTo = jobConnectorRunJobStub.args[0][0].spec.template.spec.containers[0].env.find(env => env.name === 'RAMP_TO');
            should.exists(rampTo);

            let arrivalRate = jobConnectorRunJobStub.args[0][0].spec.template.spec.containers[0].env.find(env => env.name === 'ARRIVAL_RATE');
            should.exists(arrivalRate);

            let maxVirtualUsers = jobConnectorRunJobStub.args[0][0].spec.template.spec.containers[0].env.find(env => env.name === 'MAX_VIRTUAL_USERS');
            should.exists(maxVirtualUsers);

            should(rampTo.value).eql('8');
            should(arrivalRate.value).eql('5');
            should(maxVirtualUsers.value).eql('26');
        });

        it('Simple request without ramp to, should save new job to databaseConnector, deploy the job and return the job id and the job configuration', async () => {
            const webhooks = [
                {
                    id: '5a9eee73-cf56-47aa-ac77-fad59e961aaa',
                    name: 'dina',
                    url: 'dina@mail.com',
                    global: false
                },
                {
                    id: '5a9eee73-cf56-47aa-ac77-fad59e961aab',
                    name: 'niv',
                    url: 'niv@mail.com',
                    global: false
                }
            ];
            const jobBodyWithoutRampTo = {
                test_id: TEST_ID,
                arrival_rate: 1,
                duration: 1,
                run_immediately: true,
                emails: ['dina@niv.eli'],
                environment: 'test',
                webhooks: webhooks.map(({ id }) => id)
            };
            jobConnectorRunJobStub.resolves({ id: 'run_id' });
            databaseConnectorInsertStub.resolves({ success: 'success' });
            let expectedResult = {
                id: '5a9eee73-cf56-47aa-ac77-fad59e961aaf',
                test_id: '5a9eee73-cf56-47aa-ac77-fad59e961aaa',
                environment: 'test',
                emails: ['dina@niv.eli'],
                webhooks: webhooks.map(({ id }) => id),
                arrival_rate: 1,
                duration: 1
            };
            webhooks.map(webhook => webhooksManagerGetWebhook.withArgs(webhook.id).resolves(webhook));

            let jobResponse = await manager.createJob(jobBodyWithoutRampTo);
            jobResponse.should.containEql(expectedResult);
            databaseConnectorInsertStub.callCount.should.eql(1);
            jobConnectorRunJobStub.callCount.should.eql(1);
        });

        it('Simple request with enabled as false', async () => {
            const jobBodyWithEnabledFalse = {
                test_id: TEST_ID,
                arrival_rate: 1,
                duration: 1,
                run_immediately: true,
                emails: ['dina@niv.eli'],
                environment: 'test',
                webhooks: ['5a9eee73-cf56-47aa-ac77-fad59e961aaa', '5a9eee73-cf56-47aa-ac77-fad59e961aab'],
                enabled: false
            };
            jobConnectorRunJobStub.resolves({ id: 'run_id' });
            databaseConnectorInsertStub.resolves({ success: 'success' });
            let expectedResult = {
                id: '5a9eee73-cf56-47aa-ac77-fad59e961aaf',
                test_id: '5a9eee73-cf56-47aa-ac77-fad59e961aaa',
                environment: 'test',
                emails: ['dina@niv.eli'],
                webhooks: ['5a9eee73-cf56-47aa-ac77-fad59e961aaa', '5a9eee73-cf56-47aa-ac77-fad59e961aab'],
                arrival_rate: 1,
                duration: 1,
                enabled: false
            };

            let jobResponse = await manager.createJob(jobBodyWithEnabledFalse);
            jobResponse.should.containEql(expectedResult);
            databaseConnectorInsertStub.callCount.should.eql(1);
            jobConnectorRunJobStub.callCount.should.eql(1);
        });

        it('Fail to save job to databaseConnector', function () {
            const webhooks = [
                {
                    id: '5a9eee73-cf56-47aa-ac77-fad59e961aaa',
                    name: 'dina',
                    url: 'dina@mail.com',
                    global: false
                },
                {
                    id: '5a9eee73-cf56-47aa-ac77-fad59e961aab',
                    name: 'niv',
                    url: 'niv@mail.com',
                    global: false
                }
            ];
            const jobBodyWithoutRampTo = {
                test_id: TEST_ID,
                arrival_rate: 1,
                duration: 1,
                run_immediately: true,
                emails: ['dina@niv.eli'],
                environment: 'test',
                webhooks: webhooks.map(({ id }) => id)
            };
            databaseConnectorInsertStub.rejects({ error: 'databaseConnector error' });

            return manager.createJob(jobBodyWithoutRampTo)
                .catch(function (error) {
                    jobConnectorRunJobStub.callCount.should.eql(0);
                    loggerErrorStub.callCount.should.eql(1);
                    loggerErrorStub.args[0].should.eql([{ error: 'databaseConnector error' }, 'Error occurred trying to create new job']);
                    error.should.eql({ error: 'databaseConnector error' });
                });
        });

        it('Fail to create a job', function () {
            const webhooks = [
                {
                    id: '5a9eee73-cf56-47aa-ac77-fad59e961aaa',
                    name: 'dina',
                    url: 'dina@mail.com',
                    global: false
                },
                {
                    id: '5a9eee73-cf56-47aa-ac77-fad59e961aab',
                    name: 'niv',
                    url: 'niv@mail.com',
                    global: false
                }
            ];
            const jobBodyWithoutRampTo = {
                test_id: TEST_ID,
                arrival_rate: 1,
                duration: 1,
                run_immediately: true,
                emails: ['dina@niv.eli'],
                environment: 'test',
                webhooks: webhooks.map(({ id }) => id)
            };
            jobConnectorRunJobStub.rejects({ error: 'job creator error' });
            databaseConnectorInsertStub.resolves({ success: 'success' });

            return manager.createJob(jobBodyWithoutRampTo)
                .catch(function (error) {
                    jobConnectorRunJobStub.callCount.should.eql(1);
                    loggerErrorStub.callCount.should.eql(1);
                    loggerErrorStub.args[0].should.eql([{ error: 'job creator error' }, 'Error occurred trying to create new job']);
                    error.should.eql({ error: 'job creator error' });
                });
        });

        describe('Request with cron expression, should save new job to databaseConnector, deploy the job and return the job id and the job configuration', function () {
            before(() => {
                jobConnectorRunJobStub.resolves({});
            });

            it('Validate response', function () {
                const webhooks = [
                    {
                        id: '5a9eee73-cf56-47aa-ac77-fad59e961aaa',
                        name: 'dina',
                        url: 'dina@mail.com',
                        global: false
                    },
                    {
                        id: '5a9eee73-cf56-47aa-ac77-fad59e961aab',
                        name: 'niv',
                        url: 'niv@mail.com',
                        global: false
                    }
                ];
                const jobBodyWithCron = {
                    test_id: TEST_ID,
                    id: TEST_ID,
                    arrival_rate: 1,
                    duration: 1,
                    cron_expression: '* * * * * *',
                    run_immediately: true,
                    emails: ['dina@niv.eli'],
                    environment: 'test',
                    ramp_to: '1',
                    webhooks: webhooks.map(({ id }) => id)
                };
                databaseConnectorInsertStub.resolves({ success: 'success' });
                databaseConnectorDeleteStub.resolves({});
                let expectedResult = {
                    'cron_expression': '* * * * * *',
                    ramp_to: '1',
                    id: '5a9eee73-cf56-47aa-ac77-fad59e961aaf',
                    test_id: '5a9eee73-cf56-47aa-ac77-fad59e961aaa',
                    environment: 'test',
                    emails: ['dina@niv.eli'],
                    webhooks: webhooks.map(({ id }) => id),
                    arrival_rate: 1,
                    duration: 1
                };
                webhooks.map(webhook => webhooksManagerGetWebhook.withArgs(webhook.id).resolves(webhook));

                return manager.createJob(jobBodyWithCron)
                    .then(function (result) {
                        result.should.containEql(expectedResult);
                        loggerInfoStub.callCount.should.eql(2);
                    });
            });

            it('Verify cron was invoked more than once', function (done) {
                this.timeout(5000);
                setTimeout(async () => {
                    try {
                        await manager.deleteJob('5a9eee73-cf56-47aa-ac77-fad59e961aaf');
                        loggerErrorStub.callCount.should.eql(0);
                        done();
                    } catch (error) {
                        done(new Error(error));
                    }
                }, 3000);
            });
        });

        describe('Request with cron expression and enabled=false should save new job to databaseConnector, deploy the job and return the job id and the job configuration and not run the job', function () {
            before(() => {
                jobConnectorRunJobStub.resolves({});
            });

            it('Validate response', function () {
                const webhooks = [
                    {
                        id: '5a9eee73-cf56-47aa-ac77-fad59e961aaa',
                        name: 'dina',
                        url: 'dina@mail.com',
                        global: false
                    },
                    {
                        id: '5a9eee73-cf56-47aa-ac77-fad59e961aab',
                        name: 'niv',
                        url: 'niv@mail.com',
                        global: false
                    }
                ];
                const jobBodyWithCron = {
                    test_id: TEST_ID,
                    id: TEST_ID,
                    arrival_rate: 1,
                    duration: 1,
                    cron_expression: '* * * * * *',
                    run_immediately: true,
                    emails: ['dina@niv.eli'],
                    environment: 'test',
                    ramp_to: '1',
                    webhooks: webhooks.map(({ id }) => id)
                };
                databaseConnectorInsertStub.resolves({ success: 'success' });
                databaseConnectorDeleteStub.resolves({});
                let expectedResult = {
                    'cron_expression': '* * * * * *',
                    ramp_to: '1',
                    id: '5a9eee73-cf56-47aa-ac77-fad59e961aaf',
                    test_id: '5a9eee73-cf56-47aa-ac77-fad59e961aaa',
                    environment: 'test',
                    emails: ['dina@niv.eli'],
                    webhooks: webhooks.map(({ id }) => id),
                    arrival_rate: 1,
                    duration: 1
                };
                webhooks.map(webhook => webhooksManagerGetWebhook.withArgs(webhook.id).resolves(webhook));

                let jobBodyWithCronDisabled = { ...jobBodyWithCron, enabled: false };
                return manager.createJob(jobBodyWithCronDisabled)
                    .then(function (result) {
                        result.should.containEql(expectedResult);
                        loggerInfoStub.callCount.should.eql(2);
                    });
            });

            it('Verify cron was invoked more than once', function (done) {
                this.timeout(5000);
                setTimeout(async () => {
                    try {
                        await manager.deleteJob('5a9eee73-cf56-47aa-ac77-fad59e961aaf');
                        loggerInfoStub.args[0][0].should.eql('Skipping job with id: 5a9eee73-cf56-47aa-ac77-fad59e961aaf as it\'s currently disabled');
                        loggerErrorStub.callCount.should.eql(0);
                        done();
                    } catch (error) {
                        done(new Error(error));
                    }
                }, 3000);
            });
        });

        describe('Request with cron expression, job does not exist', function () {
            before(() => {
                jobConnectorRunJobStub.resolves({});
            });

            it('Validate response', function () {
                const webhooks = [
                    {
                        id: '5a9eee73-cf56-47aa-ac77-fad59e961aaa',
                        name: 'dina',
                        url: 'dina@mail.com',
                        global: false
                    },
                    {
                        id: '5a9eee73-cf56-47aa-ac77-fad59e961aab',
                        name: 'niv',
                        url: 'niv@mail.com',
                        global: false
                    }
                ];
                const jobBodyWithCron = {
                    test_id: TEST_ID,
                    id: TEST_ID,
                    arrival_rate: 1,
                    duration: 1,
                    cron_expression: '* * * * * *',
                    run_immediately: true,
                    emails: ['dina@niv.eli'],
                    environment: 'test',
                    ramp_to: '1',
                    webhooks: webhooks.map(({ id }) => id)
                };
                jobConnectorRunJobStub.resolves({});
                databaseConnectorInsertStub.resolves({ success: 'success' });
                databaseConnectorDeleteStub.resolves({});
                let expectedResult = {
                    cron_expression: '* * * * * *',
                    ramp_to: '1',
                    id: '5a9eee73-cf56-47aa-ac77-fad59e961aaf',
                    test_id: '5a9eee73-cf56-47aa-ac77-fad59e961aaa',
                    environment: 'test',
                    emails: ['dina@niv.eli'],
                    webhooks: webhooks.map(({ id }) => id),
                    arrival_rate: 1,
                    duration: 1
                };
                webhooks.map(webhook => webhooksManagerGetWebhook.withArgs(webhook.id).resolves(webhook));

                return manager.createJob(jobBodyWithCron)
                    .then(function (result) {
                        result.should.containEql(expectedResult);
                    });
            });

            it('Verify cron was invoked more than once', function (done) {
                this.timeout(5000);
                setTimeout(async () => {
                    try {
                        await manager.deleteJob('5a9eee73-cf56-47aa-ac77-fad59e961aaf');
                        jobConnectorRunJobStub.callCount.should.eql(3);
                        done();
                    } catch (error) {
                        done(new Error(error));
                    }
                }, 3000);
            });
        });

        describe('Request with cron expression, that is not invoked immediately', function () {
            it('Validate response', function () {
                const webhooks = [
                    {
                        id: '5a9eee73-cf56-47aa-ac77-fad59e961aaa',
                        name: 'dina',
                        url: 'dina@mail.com',
                        global: false
                    },
                    {
                        id: '5a9eee73-cf56-47aa-ac77-fad59e961aab',
                        name: 'niv',
                        url: 'niv@mail.com',
                        global: false
                    }
                ];
                const jobBodyWithCronNotImmediately = {
                    test_id: TEST_ID,
                    arrival_rate: 1,
                    duration: 1,
                    cron_expression: '',
                    run_immediately: false,
                    emails: ['dina@niv.eli'],
                    environment: 'test',
                    ramp_to: '1',
                    webhooks: webhooks.map(({ id }) => id)
                };
                jobConnectorRunJobStub.resolves({});
                databaseConnectorInsertStub.resolves({ success: 'success' });
                databaseConnectorDeleteStub.resolves({});
                let date = new Date();
                date.setSeconds(date.getSeconds() + 5);
                jobBodyWithCronNotImmediately.cron_expression = date.getSeconds() + ' * * * * *';
                let expectedResult = {
                    cron_expression: date.getSeconds() + ' * * * * *',
                    ramp_to: '1',
                    id: '5a9eee73-cf56-47aa-ac77-fad59e961aaf',
                    test_id: '5a9eee73-cf56-47aa-ac77-fad59e961aaa',
                    environment: 'test',
                    emails: ['dina@niv.eli'],
                    webhooks: webhooks.map(({ id }) => id),
                    arrival_rate: 1,
                    duration: 1
                };
                webhooks.map(webhook => webhooksManagerGetWebhook.withArgs(webhook.id).resolves(webhook));

                return manager.createJob(jobBodyWithCronNotImmediately)
                    .then(function (result) {
                        result.should.containEql(expectedResult);
                        loggerInfoStub.callCount.should.eql(2);
                    });
            });

            it('Verify cron was not invoked immediately', function (done) {
                this.timeout(3000);
                setTimeout(async () => {
                    try {
                        done();
                    } catch (error) {
                        done(new Error(error));
                    }
                }, 2000);
            });

            it('Verify cron was invoked after a minute', function (done) {
                this.timeout(6000);
                setTimeout(async () => {
                    try {
                        await manager.deleteJob('5a9eee73-cf56-47aa-ac77-fad59e961aaf');
                        done();
                    } catch (error) {
                        done(new Error(error));
                    }
                }, 5000);
            });
        });
    });

    describe('Update job', function () {
        before(() => {
            manager.__set__('configHandler', {
                getConfig: () => {
                    return {
                        job_platform: 'KUBERNETES',
                        base_url: '',
                        internal_address: 'localhost:80',
                        delay_runner_ms: 0
                    };
                },
                getConfigValue: getConfigValueStub

            });
            uuidStub.returns('5a9eee73-cf56-47aa-ac77-fad59e961aaf');
        });

        it('Should update job successfully', async function () {
            const webhooks = [
                {
                    id: uuid.v4(),
                    name: 'dina',
                    url: 'dina@mail.com',
                    global: false
                },
                {
                    id: uuid.v4(),
                    name: 'niv',
                    url: 'niv@mail.com',
                    global: false
                }
            ];
            const jobBodyWithCron = {
                test_id: TEST_ID,
                id: TEST_ID,
                arrival_rate: 1,
                duration: 1,
                cron_expression: '* * * * * *',
                run_immediately: true,
                emails: ['dina@niv.eli'],
                environment: 'test',
                ramp_to: '1',
                webhooks: webhooks.map(({ id }) => id)
            };
            jobConnectorRunJobStub.resolves({});
            databaseConnectorInsertStub.resolves({ success: 'success' });
            databaseConnectorUpdateJobStub.resolves({});
            databaseConnectorGetSingleJobStub.resolves([{
                id: '5a9eee73-cf56-47aa-ac77-fad59e961aaf',
                test_id: 'secondId',
                environment: 'test',
                arrival_rate: 1,
                duration: 1,
                cron_expression: '20 * * * *',
                emails: null,
                webhooks: jobBodyWithCron.webhooks,
                ramp_to: '1'
            }]);
            webhooks.forEach(webhook => webhooksManagerGetWebhook.withArgs(webhook.id).resolves(webhook));
            await manager.createJob(jobBodyWithCron);
            await manager.updateJob('5a9eee73-cf56-47aa-ac77-fad59e961aaf', { cron_expression: '20 * * * *' });
            loggerInfoStub.callCount.should.eql(4);
            manager.__get__('cronJobs')[JOB_ID].cronTime.source.should.eql('20 * * * *');
            await manager.deleteJob('5a9eee73-cf56-47aa-ac77-fad59e961aaf');
        });

        it('Updating data in databaseConnector fails', async function () {
            const jobBodyWithCron = {
                test_id: TEST_ID,
                id: TEST_ID,
                arrival_rate: 1,
                duration: 1,
                cron_expression: '* * * * * *',
                run_immediately: true,
                emails: ['dina@niv.eli'],
                environment: 'test',
                ramp_to: '1',
                webhooks: []
            };
            try {
                jobConnectorRunJobStub.resolves({});
                databaseConnectorInsertStub.resolves({ success: 'success' });
                databaseConnectorUpdateJobStub.rejects({ error: 'error' });
                await manager.createJob(jobBodyWithCron);
                await manager.updateJob('5a9eee73-cf56-47aa-ac77-fad59e961aaf', { cron_expression: '20 * * * *' });
            } catch (error) {
                error.should.eql({ error: 'error' });
                loggerInfoStub.callCount.should.eql(2);
                loggerErrorStub.callCount.should.eql(1);
                manager.__get__('cronJobs')[JOB_ID].cronTime.source.should.eql('* * * * * *');
                await manager.deleteJob('5a9eee73-cf56-47aa-ac77-fad59e961aaf');
            }
        });
    });

    describe('Delete scheduled job', function () {
        it('Deletes an existing job', async function () {
            const jobBodyWithCron = {
                test_id: TEST_ID,
                id: TEST_ID,
                arrival_rate: 1,
                duration: 1,
                cron_expression: '* * * * * *',
                run_immediately: true,
                emails: ['dina@niv.eli'],
                environment: 'test',
                ramp_to: '1',
                webhooks: []
            };
            manager.__set__('configHandler', {
                getConfig: () => {
                    return {
                        job_platform: 'KUBERNETES',
                        base_url: '',
                        internal_address: 'localhost:80',
                        delay_runner_ms: 0
                    };
                },
                getConfigValue: getConfigValueStub

            });
            uuidStub.returns('5a9eee73-cf56-47aa-ac77-fad59e961aaf');
            jobConnectorRunJobStub.resolves({});
            databaseConnectorInsertStub.resolves({ success: 'success' });
            databaseConnectorDeleteStub.resolves({});

            await manager.createJob(jobBodyWithCron);
            await manager.deleteJob('5a9eee73-cf56-47aa-ac77-fad59e961aaf');
            databaseConnectorDeleteStub.callCount.should.eql(1);
            loggerInfoStub.args[2].should.eql(['Job: 5a9eee73-cf56-47aa-ac77-fad59e961aaf completed.']);
        });
    });

    describe('Stop run', function () {
        it('Stop an existing run of a job', async function () {
            await manager.stopRun('jobId', 'runId', 'internalRunId');
            jobStopRunStub.callCount.should.eql(1);
            jobStopRunStub.args[0].should.eql([
                'predator.jobId',
                'runId'
            ]);
        });
    });

    describe('Get jobs', function () {
        it('Get a list of all jobs - also one time jobs', async function () {
            databaseConnectorGetStub.resolves([{
                id: 'id',
                type: 'load_test',
                test_id: 'test_id',
                environment: 'test',
                arrival_rate: 1,
                duration: 1,
                cron_expression: '* * * * *',
                emails: null,
                webhooks: ['dina', 'niv'],
                ramp_to: '1',
                notes: 'some notes',
                proxy_url: 'http://proxyUrl.com',
                debug: '*',
                enabled: false
            },
            {
                id: 'id2',
                type: 'load_test',
                test_id: 'test_id2',
                arrival_rate: 1,
                duration: 1,
                environment: 'test',
                cron_expression: null,
                emails: ['eli@eli.eli'],
                webhooks: null,
                ramp_to: '1',
                notes: 'some other notes',
                proxy_url: 'http://proxyUrl.com',
                debug: '*'
            }]
            );

            let expectedResult = [{
                id: 'id',
                type: 'load_test',
                test_id: 'test_id',
                cron_expression: '* * * * *',
                webhooks: ['dina', 'niv'],
                ramp_to: '1',
                arrival_count: undefined,
                arrival_rate: 1,
                duration: 1,
                environment: 'test',
                custom_env_vars: undefined,
                max_virtual_users: undefined,
                parallelism: undefined,
                run_id: undefined,
                notes: 'some notes',
                proxy_url: 'http://proxyUrl.com',
                debug: '*',
                enabled: false
            }, {
                id: 'id2',
                type: 'load_test',
                test_id: 'test_id2',
                emails: ['eli@eli.eli'],
                ramp_to: '1',
                arrival_count: undefined,
                arrival_rate: 1,
                duration: 1,
                environment: 'test',
                custom_env_vars: undefined,
                max_virtual_users: undefined,
                parallelism: undefined,
                run_id: undefined,
                notes: 'some other notes',
                proxy_url: 'http://proxyUrl.com',
                debug: '*',
                enabled: true
            }];
            let jobs = await manager.getJobs(true);
            jobs.should.eql(expectedResult);
            databaseConnectorGetStub.callCount.should.eql(1);
        });

        it('Get a list of jobs - only scheduled jobs', async function () {
            databaseConnectorGetStub.resolves([{
                id: 'id',
                type: 'functional_test',
                test_id: 'test_id',
                environment: 'test',
                arrival_count: 1,
                duration: 1,
                cron_expression: '* * * * *',
                emails: null,
                webhooks: ['dina', 'niv'],
                enabled: false
            },
            {
                id: 'id2',
                type: 'load_test',
                test_id: 'test_id2',
                arrival_rate: 1,
                duration: 1,
                environment: 'test',
                cron_expression: null,
                emails: ['eli@eli.eli'],
                webhooks: null,
                ramp_to: '1',
            }]
            );

            let expectedResult = [{
                id: 'id',
                type: 'functional_test',
                test_id: 'test_id',
                cron_expression: '* * * * *',
                webhooks: ['dina', 'niv'],
                ramp_to: undefined,
                arrival_count: 1,
                arrival_rate: undefined,
                duration: 1,
                environment: 'test',
                custom_env_vars: undefined,
                max_virtual_users: undefined,
                parallelism: undefined,
                run_id: undefined,
                notes: undefined,
                proxy_url: undefined,
                debug: undefined,
                enabled: false
            }];
            let jobs = await manager.getJobs();
            jobs.should.eql(expectedResult);
            databaseConnectorGetStub.callCount.should.eql(1);
        });

        it('Get empty list of jobs', async function () {
            databaseConnectorGetStub.resolves([]);

            let jobs = await manager.getJobs();
            jobs.should.eql([]);
            databaseConnectorGetStub.callCount.should.eql(1);
            loggerInfoStub.callCount.should.eql(1);
        });

        it('Fail to get jobs from databaseConnector', function () {
            databaseConnectorGetStub.rejects({ error: 'databaseConnector error' });

            return manager.getJobs()
                .catch(function (error) {
                    jobConnectorRunJobStub.callCount.should.eql(0);
                    loggerErrorStub.callCount.should.eql(1);
                    loggerErrorStub.args[0].should.eql([{ error: 'databaseConnector error' }, 'Error occurred trying to get jobs']);
                    error.should.eql({ error: 'databaseConnector error' });
                });
        });
    });

    describe('Get job', function () {
        it('Get a list of jobs', async function () {
            databaseConnectorGetSingleJobStub.resolves([{
                id: 'id',
                type: 'load_test',
                test_id: 'test_id',
                environment: 'test',
                arrival_rate: 1,
                duration: 1,
                cron_expression: '* * * * *',
                emails: null,
                webhooks: ['dina', 'niv'],
                ramp_to: '1',
                notes: 'some nice notes',
                proxy_url: 'http://proxyUrl.com',
                debug: '*'
            }]);

            let expectedResult = {
                id: 'id',
                type: 'load_test',
                test_id: 'test_id',
                cron_expression: '* * * * *',
                webhooks: ['dina', 'niv'],
                ramp_to: '1',
                arrival_count: undefined,
                arrival_rate: 1,
                duration: 1,
                environment: 'test',
                custom_env_vars: undefined,
                max_virtual_users: undefined,
                parallelism: undefined,
                run_id: undefined,
                notes: 'some nice notes',
                proxy_url: 'http://proxyUrl.com',
                debug: '*',
                enabled: true
            };

            let job = await manager.getJob('id');
            job.should.eql(expectedResult);
            databaseConnectorGetSingleJobStub.callCount.should.eql(1);
        });

        it('databaseConnector returns empty list, should return job not found', function () {
            databaseConnectorGetSingleJobStub.resolves([]);
            return manager.getJob('id')
                .then(function () {
                    return Promise.reject(new Error('Should not get here'));
                })
                .catch(function (err) {
                    err.statusCode.should.eql(404);
                    err.message.should.eql('Not found');
                });
        });

        it('databaseConnector returns list of few rows, should return error', function () {
            databaseConnectorGetSingleJobStub.resolves(['one row', 'second row']);
            return manager.getJob('id')
                .then(function () {
                    return Promise.reject(new Error('Should not get here'));
                })
                .catch(function (err) {
                    err.statusCode.should.eql(500);
                    err.message.should.eql('Error occurred in database response');
                });
        });

        it('Fail to get jobs from databaseConnector', function () {
            databaseConnectorGetSingleJobStub.rejects({ error: 'databaseConnector error' });

            return manager.getJob('id')
                .catch(function (error) {
                    jobConnectorRunJobStub.callCount.should.eql(0);
                    loggerErrorStub.callCount.should.eql(1);
                    loggerErrorStub.args[0].should.eql([{ error: 'databaseConnector error' }, 'Error occurred trying to get job']);
                    error.should.eql({ error: 'databaseConnector error' });
                });
        });
    });

    describe('Get logs', function () {
        it('Success getting logs from job', async function () {
            jobGetLogsStub.resolves([{ type: 'file', name: 'log.txt', content: 'this is the log' }]);
            let logs = await manager.getLogs('jobId', 'runId');
            logs.should.eql({
                files: [{ type: 'file', name: 'log.txt', content: 'this is the log' }],
                filename: 'jobId-runId.zip'
            });
        });

        it('Get logs from job fails', async function () {
            jobGetLogsStub.rejects(new Error('error getting logs'));
            try {
                await manager.getLogs('jobId', 'runId');
                throw new Error('should not get here');
            } catch (error) {
                error.message.should.eql('error getting logs');
            }
        });
    });

    describe('Delete containers', function () {
        it('Success deleting jobs from connector', async function () {
            jobDeleteContainerStub.resolves({deleted: 10});
            let result = await manager.deleteAllContainers();
            result.should.eql({
                deleted: 10
            });

            jobDeleteContainerStub.args[0][0].should.containEql('predator');
        });

        it('Get logs from job fails', async function () {
            jobDeleteContainerStub.rejects({message: 'Failed to delete containers'});
            try {
                await manager.deleteAllContainers();
                throw new Error('should not get here');
            } catch (error) {
                error.message.should.eql('Failed to delete containers');
            }
        });
    });

    describe('meow', function() {

    });
});
