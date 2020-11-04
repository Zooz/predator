const should = require('should'),
    schedulerRequestCreator = require('./helpers/requestCreator'),
    testsRequestCreator = require('../tests/helpers/requestCreator'),
    configRequestCreator = require('../configManager/helpers/requestCreator'),
    nock = require('nock');

describe('Create job specific aws fargate tests', async function () {
    this.timeout(20000);
    let testId;
    let expectedResult;
    beforeEach(async () => {
        nock.cleanAll();
    });
    const jobPlatform = process.env.JOB_PLATFORM;
    if (jobPlatform.toUpperCase() === 'AWS_FARGATE') {
        describe('AWS FARGATE', () => {
            before(async () => {
                process.env.AWS_ACCESS_KEY_ID = 'AWS_ACCESS_KEY_ID';
                process.env.AWS_SECRET_ACCESS_KEY = 'AWS_SECRET_ACCESS_KEY';
                await schedulerRequestCreator.init();
                await testsRequestCreator.init();
                await configRequestCreator.init();

                await configRequestCreator.updateConfig({
                    runner_docker_image: 'zooz/predator-runner:latest',
                    custom_runner_definition: {
                        'us-west-2': {
                            capacity_provider: 'FARGATE_SPOT',
                            subnets: [
                                'subnet-1',
                                'subnet-2'
                            ],
                            task_definition: 'predator-runner',
                            flag: 'usa'
                        }
                    }
                });

                const requestBody = require('../../testExamples/Basic_test');
                const response = await testsRequestCreator.createTest(requestBody, {});
                should(response.statusCode).eql(201);
                should(response.body).have.key('id');
                testId = response.body.id;

                expectedResult = {
                    environment: 'test',
                    test_id: testId,
                    duration: 1,
                    arrival_rate: 1,
                    max_virtual_users: 100,
                    proxy_url: 'http://proxy.com',
                    debug: '*'
                };
            });

            describe('Good requests', () => {
                let jobId;

                describe('Create one time job with parallelism 2, job not yet exists, should create job with the right parameters and run it, finally stop and delete it', () => {
                    let createJobResponse;
                    let getJobsFromService;

                    it('Create the job', async () => {
                        const validBody = {
                            test_id: testId,
                            arrival_rate: 1,
                            parallelism: 2,
                            type: 'load_test',
                            duration: 1,
                            environment: 'test',
                            run_immediately: true,
                            max_virtual_users: 100,
                            proxy_url: 'http://proxy.com',
                            debug: '*',
                            tag: 'us-west-2'
                        };

                        nock('https://ecs.us-west-2.amazonaws.com:443', { encodedQueryParams: true })
                            .post('/', () => {
                                return true;
                            }).reply(200, {});
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

                    it('Stop run', async () => {
                        nock('https://ecs.us-west-2.amazonaws.com:443', { encodedQueryParams: true })
                            .post('/', { desiredStatus: 'RUNNING' })
                            .reply(200, { taskArns: ['1', '2', '3'] });

                        nock('https://ecs.us-west-2.amazonaws.com:443', { encodedQueryParams: true })
                            .post('/', { tasks: ['1', '2', '3'], include: ['TAGS'] })
                            .reply(200, {
                                tasks: [{
                                    taskArn: 1,
                                    tags: [{
                                        key: 'job_identifier',
                                        value: `predator.${createJobResponse.body.report_id}`
                                    }]
                                },
                                {
                                    taskArn: 2,
                                    tags: [{
                                        key: 'job_identifier',
                                        value: `predator.${createJobResponse.body.report_id}`
                                    }]
                                }]
                            });

                        const stopTask1 = nock('https://ecs.us-west-2.amazonaws.com:443', { encodedQueryParams: true })
                            .post('/', { task: '1' })
                            .reply(204, {});

                        const stopTask2 = nock('https://ecs.us-west-2.amazonaws.com:443', { encodedQueryParams: true })
                            .post('/', { task: '2' })
                            .reply(204, {});

                        const stopRunResponse = await schedulerRequestCreator.stopRun(createJobResponse.body.id, createJobResponse.body.report_id, {
                            'Content-Type': 'application/json'
                        });

                        should(stopTask1.isDone()).eql(true);
                        should(stopTask2.isDone()).eql(true);
                        should(stopRunResponse.status).eql(204);
                    });
                });
            });

            describe('Bad requests', () => {
                it('create job with tag that not exists', async () => {
                    const invalidBody = {
                        test_id: testId,
                        arrival_rate: 1,
                        parallelism: 2,
                        type: 'load_test',
                        duration: 1,
                        environment: 'test',
                        run_immediately: true,
                        max_virtual_users: 100,
                        proxy_url: 'http://proxy.com',
                        debug: '*',
                        tag: 'us-west-100'
                    };
                    const response = await schedulerRequestCreator.createJob(invalidBody, {
                        'Content-Type': 'application/json'
                    });
                    should(response.statusCode).eql(400);
                    should(response.body.message).eql('custom_runner_definition is missing key for tag: us-west-100');
                });
                it('create job without tag', async () => {
                    const invalidBody = {
                        test_id: testId,
                        arrival_rate: 1,
                        parallelism: 2,
                        type: 'load_test',
                        duration: 1,
                        environment: 'test',
                        cron_expresion: '* * * * * *',
                        max_virtual_users: 100,
                    };
                    const response = await schedulerRequestCreator.createJob(invalidBody, {
                        'Content-Type': 'application/json'
                    });
                    should(response.statusCode).eql(400);
                    should(response.body.message).eql('tag must be provided when JOB_PLATFORM is AWS_FARGATE');
                });

            });
        });
    }
});
