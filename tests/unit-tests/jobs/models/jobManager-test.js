'use strict';
const should = require('should'),
    rewire = require('rewire'),
    sinon = require('sinon'),
    databaseConnector = require('../../../../src/jobs/models/database/databaseConnector'),
    logger = require('../../../../src/common/logger'),
    uuid = require('uuid'),
    jobConnector = require('../../../../src/jobs/models/kubernetes/jobConnector'),
    dockerHubConnector = require('../../../../src/jobs/models/dockerHubConnector'),
    jobTemplate = require('../../../../src/jobs/models/kubernetes/jobTemplate');

let manager;

const TEST_ID = '5a9eee73-cf56-47aa-ac77-fad59e961aaa';
const JOB_ID = '5a9eee73-cf56-47aa-ac77-fad59e961aaf';

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
    webhooks: ['dina', 'niv', 'eli']
};
const jobBodyWithCronNotImmediately = {
    test_id: TEST_ID,
    arrival_rate: 1,
    duration: 1,
    cron_expression: '',
    run_immediately: false,
    emails: ['dina@niv.eli'],
    environment: 'test',
    ramp_to: '1',
    webhooks: ['dina', 'niv', 'eli']
};
const jobBodyWithoutCron = {
    test_id: TEST_ID,
    arrival_rate: 1,
    duration: 1,
    run_immediately: true,
    emails: ['dina@niv.eli'],
    environment: 'test',
    ramp_to: '1',
    webhooks: ['dina', 'niv', 'eli']
};

const jobBodyWithParallelismThatSplitsNicely = {
    test_id: TEST_ID,
    arrival_rate: 99,
    duration: 1,
    run_immediately: true,
    emails: ['dina@niv.eli'],
    environment: 'test',
    ramp_to: '150',
    parallelism: 3,
    webhooks: ['dina', 'niv', 'eli'],
    max_virtual_users: 198
};

const jobBodyWithParallelismThatSplitsWithDecimal = {
    test_id: TEST_ID,
    arrival_rate: 99,
    duration: 1,
    run_immediately: true,
    emails: ['dina@niv.eli'],
    environment: 'test',
    ramp_to: '150',
    parallelism: 20,
    webhooks: ['dina', 'niv', 'eli'],
    max_virtual_users: 510
};

const jobBodyWithoutRampTo = {
    test_id: TEST_ID,
    arrival_rate: 1,
    duration: 1,
    run_immediately: true,
    emails: ['dina@niv.eli'],
    environment: 'test',
    webhooks: ['dina', 'niv', 'eli']
};

const jobBodyWithCustomEnvVars = {
    test_id: TEST_ID,
    arrival_rate: 1,
    duration: 1,
    run_immediately: true,
    emails: ['dina@niv.eli'],
    environment: 'test',
    webhooks: ['dina', 'niv', 'eli'],
    custom_env_vars: { 'KEY1': 'A', 'KEY2': 'B' },
    max_virtual_users: 100
};

describe('Manager tests', function () {
    let sandbox;
    let cassandraInsertStub;
    let loggerErrorStub;
    let loggerInfoStub;
    let jobConnectorRunJobStub;
    let jobStopRunStub;
    let jobGetLogsStub;
    let uuidStub;
    let cassandraDeleteStub;
    let cassandraGetStub;
    let cassandraGetSingleJobStub;
    let cassandraUpdateJobStub;
    let dockerHubConnectorGetMostRecentTagStub;
    let jobTemplateCreateJobRequestStub;

    before(() => {
        sandbox = sinon.sandbox.create();

        cassandraInsertStub = sandbox.stub(databaseConnector, 'insertJob');
        cassandraGetStub = sandbox.stub(databaseConnector, 'getJobs');
        cassandraGetSingleJobStub = sandbox.stub(databaseConnector, 'getJob');
        cassandraDeleteStub = sandbox.stub(databaseConnector, 'deleteJob');
        cassandraUpdateJobStub = sandbox.stub(databaseConnector, 'updateJob');
        jobGetLogsStub = sandbox.stub(jobConnector, 'getLogs');
        jobStopRunStub = sandbox.stub(jobConnector, 'stopRun');
        loggerErrorStub = sandbox.stub(logger, 'error');
        loggerInfoStub = sandbox.stub(logger, 'info');
        jobConnectorRunJobStub = sandbox.stub(jobConnector, 'runJob');
        dockerHubConnectorGetMostRecentTagStub = sandbox.stub(dockerHubConnector, 'getMostRecentRunnerTag');
        uuidStub = sandbox.stub(uuid, 'v4');
        jobTemplateCreateJobRequestStub = sandbox.spy(jobTemplate, 'createJobRequest');

        manager = rewire('../../../../src/jobs/models/jobManager');
        manager.__set__('configHandler', {
            getConfig: () => {
                return {
                    job_platform: 'KUBERNETES',
                    concurrency_limit: 100,
                    delay_runner_ms: 0
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

    describe('Reload cron jobs', function () {
        before(() => {
            dockerHubConnectorGetMostRecentTagStub.resolves();
        });

        it('Cassandra connector returns an empty array', async () => {
            cassandraGetStub.resolves([]);
            await manager.reloadCronJobs();
            manager.__get__('cronJobs').should.eql({});
        });

        it('Cassandra connector returns an array with job with no schedules', async () => {
            cassandraGetStub.resolves([{ cron_expression: null }]);
            await manager.reloadCronJobs();
            manager.__get__('cronJobs').should.eql({});
        });

        describe('Cassandra connector returns an array with job with schedules, and job exist and can be run', function () {
            it('Verify job added', async function () {
                cassandraGetStub.resolves([jobBodyWithCron]);
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
                }
            });
            uuidStub.returns('5a9eee73-cf56-47aa-ac77-fad59e961aaf');
        });

        it('Simple request with custom env vars, should save new job to cassandra, deploy the job and return the job id and the job configuration', async () => {
            jobConnectorRunJobStub.resolves({ id: 'run_id' });
            cassandraInsertStub.resolves({ success: 'success' });
            let expectedResult = {
                id: '5a9eee73-cf56-47aa-ac77-fad59e961aaf',
                test_id: '5a9eee73-cf56-47aa-ac77-fad59e961aaa',
                environment: 'test',
                emails: ['dina@niv.eli'],
                webhooks: ['dina', 'niv', 'eli'],
                arrival_rate: 1,
                duration: 1,
                max_virtual_users: 100,
                'custom_env_vars':
                    {
                        'KEY1': 'A',
                        'KEY2': 'B'
                    }
            };

            let jobResponse = await manager.createJob(jobBodyWithCustomEnvVars);
            jobResponse.should.containEql(expectedResult);
            cassandraInsertStub.callCount.should.eql(1);
            jobConnectorRunJobStub.callCount.should.eql(1);
            jobTemplateCreateJobRequestStub.args[0][3].should.containEql({
                JOB_ID: '5a9eee73-cf56-47aa-ac77-fad59e961aaf',
                ENVIRONMENT: 'test',
                TEST_ID: '5a9eee73-cf56-47aa-ac77-fad59e961aaa',
                PREDATOR_URL: 'localhost:80',
                ARRIVAL_RATE: '1',
                DURATION: '1',
                EMAILS: 'dina@niv.eli',
                WEBHOOKS: 'dina;niv;eli',
                CUSTOM_KEY1: 'A',
                CUSTOM_KEY2: 'B'
            });

            jobTemplateCreateJobRequestStub.args[0][3].should.have.key('RUN_ID');
        });

        it('Simple request, should save new job to cassandra, deploy the job and return the job id and the job configuration', async () => {
            jobConnectorRunJobStub.resolves({});
            cassandraInsertStub.resolves({ success: 'success' });
            let expectedResult = {
                id: '5a9eee73-cf56-47aa-ac77-fad59e961aaf',
                ramp_to: '1',
                test_id: '5a9eee73-cf56-47aa-ac77-fad59e961aaa',
                environment: 'test',
                emails: ['dina@niv.eli'],
                webhooks: ['dina', 'niv', 'eli'],
                arrival_rate: 1,
                duration: 1
            };

            let jobResponse = await manager.createJob(jobBodyWithoutCron);
            jobResponse.should.containEql(expectedResult);
            cassandraInsertStub.callCount.should.eql(1);
            jobConnectorRunJobStub.callCount.should.eql(1);
        });

        it('Simple request, with parallelism, should save new job to cassandra, deploy the job and return the job id and the job configuration', async () => {
            jobConnectorRunJobStub.resolves({});
            cassandraInsertStub.resolves({ success: 'success' });
            let expectedResult = {
                id: '5a9eee73-cf56-47aa-ac77-fad59e961aaf',
                ramp_to: '150',
                test_id: '5a9eee73-cf56-47aa-ac77-fad59e961aaa',
                environment: 'test',
                emails: ['dina@niv.eli'],
                parallelism: 3,
                webhooks: ['dina', 'niv', 'eli'],
                arrival_rate: 99,
                duration: 1,
                max_virtual_users: 198
            };

            let jobResponse = await manager.createJob(jobBodyWithParallelismThatSplitsNicely);
            jobResponse.should.containEql(expectedResult);
            cassandraInsertStub.callCount.should.eql(1);
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
            jobConnectorRunJobStub.resolves({});
            cassandraInsertStub.resolves({ success: 'success' });
            let expectedResult = {
                id: '5a9eee73-cf56-47aa-ac77-fad59e961aaf',
                ramp_to: '150',
                test_id: '5a9eee73-cf56-47aa-ac77-fad59e961aaa',
                environment: 'test',
                emails: ['dina@niv.eli'],
                parallelism: 20,
                webhooks: ['dina', 'niv', 'eli'],
                arrival_rate: 99,
                duration: 1,
                max_virtual_users: 510
            };

            let jobResponse = await manager.createJob(jobBodyWithParallelismThatSplitsWithDecimal);
            jobResponse.should.containEql(expectedResult);
            cassandraInsertStub.callCount.should.eql(1);
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

        it('Simple request without ramp to, should save new job to cassandra, deploy the job and return the job id and the job configuration', async () => {
            jobConnectorRunJobStub.resolves({ id: 'run_id' });
            cassandraInsertStub.resolves({ success: 'success' });
            let expectedResult = {
                id: '5a9eee73-cf56-47aa-ac77-fad59e961aaf',
                test_id: '5a9eee73-cf56-47aa-ac77-fad59e961aaa',
                environment: 'test',
                emails: ['dina@niv.eli'],
                webhooks: ['dina', 'niv', 'eli'],
                arrival_rate: 1,
                duration: 1
            };

            let jobResponse = await manager.createJob(jobBodyWithoutRampTo);
            jobResponse.should.containEql(expectedResult);
            cassandraInsertStub.callCount.should.eql(1);
            jobConnectorRunJobStub.callCount.should.eql(1);
        });

        it('Fail to save job to cassandra', function () {
            cassandraInsertStub.rejects({ error: 'cassandra error' });

            return manager.createJob(jobBodyWithoutRampTo)
                .catch(function (error) {
                    jobConnectorRunJobStub.callCount.should.eql(0);
                    loggerErrorStub.callCount.should.eql(1);
                    loggerErrorStub.args[0].should.eql([{ error: 'cassandra error' }, 'Error occurred trying to create new job']);
                    error.should.eql({ error: 'cassandra error' });
                });
        });

        it('Fail to create a job', function () {
            jobConnectorRunJobStub.rejects({ error: 'job creator error' });
            cassandraInsertStub.resolves({ success: 'success' });

            return manager.createJob(jobBodyWithoutRampTo)
                .catch(function (error) {
                    jobConnectorRunJobStub.callCount.should.eql(1);
                    loggerErrorStub.callCount.should.eql(1);
                    loggerErrorStub.args[0].should.eql([{ error: 'job creator error' }, 'Error occurred trying to create new job']);
                    error.should.eql({ error: 'job creator error' });
                });
        });

        describe('Request with cron expression, should save new job to cassandra, deploy the job and return the job id and the job configuration', function () {
            before(() => {
                jobConnectorRunJobStub.resolves({});
            });

            it('Validate response', function () {
                cassandraInsertStub.resolves({ success: 'success' });
                cassandraDeleteStub.resolves({});
                let expectedResult = {
                    'cron_expression': '* * * * * *',
                    ramp_to: '1',
                    id: '5a9eee73-cf56-47aa-ac77-fad59e961aaf',
                    test_id: '5a9eee73-cf56-47aa-ac77-fad59e961aaa',
                    environment: 'test',
                    emails: ['dina@niv.eli'],
                    webhooks: ['dina', 'niv', 'eli'],
                    arrival_rate: 1,
                    duration: 1
                };

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

        describe('Request with cron expression, job does not exist', function () {
            before(() => {
                jobConnectorRunJobStub.resolves({});
            });

            it('Validate response', function () {
                jobConnectorRunJobStub.resolves({});
                cassandraInsertStub.resolves({ success: 'success' });
                cassandraDeleteStub.resolves({});
                let expectedResult = {
                    cron_expression: '* * * * * *',
                    ramp_to: '1',
                    id: '5a9eee73-cf56-47aa-ac77-fad59e961aaf',
                    test_id: '5a9eee73-cf56-47aa-ac77-fad59e961aaa',
                    environment: 'test',
                    emails: ['dina@niv.eli'],
                    webhooks: ['dina', 'niv', 'eli'],
                    arrival_rate: 1,
                    duration: 1
                };

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
                jobConnectorRunJobStub.resolves({});
                cassandraInsertStub.resolves({ success: 'success' });
                cassandraDeleteStub.resolves({});
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
                    webhooks: ['dina', 'niv', 'eli'],
                    arrival_rate: 1,
                    duration: 1
                };

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
                }
            });
            uuidStub.returns('5a9eee73-cf56-47aa-ac77-fad59e961aaf');
        });

        it('Should update job successfully', async function () {
            jobConnectorRunJobStub.resolves({});
            cassandraInsertStub.resolves({ success: 'success' });
            cassandraUpdateJobStub.resolves({});
            cassandraGetSingleJobStub.resolves([{
                id: '5a9eee73-cf56-47aa-ac77-fad59e961aaf',
                test_id: 'secondId',
                environment: 'test',
                arrival_rate: 1,
                duration: 1,
                cron_expression: '20 * * * *',
                emails: null,
                webhooks: ['dina', 'niv'],
                ramp_to: '1'
            }]);
            await manager.createJob(jobBodyWithCron);
            await manager.updateJob('5a9eee73-cf56-47aa-ac77-fad59e961aaf', { cron_expression: '20 * * * *' });
            loggerInfoStub.callCount.should.eql(4);
            manager.__get__('cronJobs')[JOB_ID].cronTime.source.should.eql('20 * * * *');
            await manager.deleteJob('5a9eee73-cf56-47aa-ac77-fad59e961aaf');
        });

        it('Updating data in cassandra fails', async function () {
            try {
                jobConnectorRunJobStub.resolves({});
                cassandraInsertStub.resolves({ success: 'success' });
                cassandraUpdateJobStub.rejects({ error: 'error' });
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
            manager.__set__('configHandler', {
                getConfig: () => {
                    return {
                        job_platform: 'KUBERNETES',
                        base_url: '',
                        internal_address: 'localhost:80',
                        delay_runner_ms: 0
                    };
                }
            });
            uuidStub.returns('5a9eee73-cf56-47aa-ac77-fad59e961aaf');
            jobConnectorRunJobStub.resolves({});
            cassandraInsertStub.resolves({ success: 'success' });
            cassandraDeleteStub.resolves({});

            await manager.createJob(jobBodyWithCron);
            await manager.deleteJob('5a9eee73-cf56-47aa-ac77-fad59e961aaf');
            cassandraDeleteStub.callCount.should.eql(1);
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
            cassandraGetStub.resolves([{
                id: 'id',
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
                debug: '*'
            },
            {
                id: 'id2',
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
                test_id: 'test_id',
                cron_expression: '* * * * *',
                webhooks: ['dina', 'niv'],
                ramp_to: '1',
                arrival_rate: 1,
                duration: 1,
                environment: 'test',
                custom_env_vars: undefined,
                max_virtual_users: undefined,
                parallelism: undefined,
                run_id: undefined,
                notes: 'some notes',
                proxy_url: 'http://proxyUrl.com',
                debug: '*'
            }, {
                id: 'id2',
                test_id: 'test_id2',
                emails: ['eli@eli.eli'],
                ramp_to: '1',
                arrival_rate: 1,
                duration: 1,
                environment: 'test',
                custom_env_vars: undefined,
                max_virtual_users: undefined,
                parallelism: undefined,
                run_id: undefined,
                notes: 'some other notes',
                proxy_url: 'http://proxyUrl.com',
                debug: '*'
            }];
            let jobs = await manager.getJobs(true);
            jobs.should.eql(expectedResult);
            cassandraGetStub.callCount.should.eql(1);
        });

        it('Get a list of jobs - only scheduled jobs', async function () {
            cassandraGetStub.resolves([{
                id: 'id',
                test_id: 'test_id',
                environment: 'test',
                arrival_rate: 1,
                duration: 1,
                cron_expression: '* * * * *',
                emails: null,
                webhooks: ['dina', 'niv'],
                ramp_to: '1'
            },
            {
                id: 'id2',
                test_id: 'test_id2',
                arrival_rate: 1,
                duration: 1,
                environment: 'test',
                cron_expression: null,
                emails: ['eli@eli.eli'],
                webhooks: null,
                ramp_to: '1'
            }]
            );

            let expectedResult = [{
                id: 'id',
                test_id: 'test_id',
                cron_expression: '* * * * *',
                webhooks: ['dina', 'niv'],
                ramp_to: '1',
                arrival_rate: 1,
                duration: 1,
                environment: 'test',
                custom_env_vars: undefined,
                max_virtual_users: undefined,
                parallelism: undefined,
                run_id: undefined,
                notes: undefined,
                proxy_url: undefined,
                debug: undefined
            }];
            let jobs = await manager.getJobs();
            jobs.should.eql(expectedResult);
            cassandraGetStub.callCount.should.eql(1);
        });

        it('Get empty list of jobs', async function () {
            cassandraGetStub.resolves([]);

            let jobs = await manager.getJobs();
            jobs.should.eql([]);
            cassandraGetStub.callCount.should.eql(1);
            loggerInfoStub.callCount.should.eql(1);
        });

        it('Fail to get jobs from cassandra', function () {
            cassandraGetStub.rejects({ error: 'cassandra error' });

            return manager.getJobs()
                .catch(function (error) {
                    jobConnectorRunJobStub.callCount.should.eql(0);
                    loggerErrorStub.callCount.should.eql(1);
                    loggerErrorStub.args[0].should.eql([{ error: 'cassandra error' }, 'Error occurred trying to get jobs']);
                    error.should.eql({ error: 'cassandra error' });
                });
        });
    });

    describe('Get job', function () {
        it('Get a list of jobs', async function () {
            cassandraGetSingleJobStub.resolves([{
                id: 'id',
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
                test_id: 'test_id',
                cron_expression: '* * * * *',
                webhooks: ['dina', 'niv'],
                ramp_to: '1',
                arrival_rate: 1,
                duration: 1,
                environment: 'test',
                custom_env_vars: undefined,
                max_virtual_users: undefined,
                parallelism: undefined,
                run_id: undefined,
                notes: 'some nice notes',
                proxy_url: 'http://proxyUrl.com',
                debug: '*'
            };

            let job = await manager.getJob('id');
            job.should.eql(expectedResult);
            cassandraGetSingleJobStub.callCount.should.eql(1);
        });

        it('cassandra returns empty list, should return job not found', function () {
            cassandraGetSingleJobStub.resolves([]);
            return manager.getJob('id')
                .then(function () {
                    return Promise.reject(new Error('Should not get here'));
                })
                .catch(function (err) {
                    err.statusCode.should.eql(404);
                    err.message.should.eql('Not found');
                });
        });

        it('cassandra returns list of few rows, should return error', function () {
            cassandraGetSingleJobStub.resolves(['one row', 'second row']);
            return manager.getJob('id')
                .then(function () {
                    return Promise.reject(new Error('Should not get here'));
                })
                .catch(function (err) {
                    err.statusCode.should.eql(500);
                    err.message.should.eql('Error occurred in database response');
                });
        });

        it('Fail to get jobs from cassandra', function () {
            cassandraGetSingleJobStub.rejects({ error: 'cassandra error' });

            return manager.getJob('id')
                .catch(function (error) {
                    jobConnectorRunJobStub.callCount.should.eql(0);
                    loggerErrorStub.callCount.should.eql(1);
                    loggerErrorStub.args[0].should.eql([{ error: 'cassandra error' }, 'Error occurred trying to get job']);
                    error.should.eql({ error: 'cassandra error' });
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
});