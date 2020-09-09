const should = require('should'),
    uuid = require('uuid'),
    schedulerRequestCreator = require('./helpers/requestCreator'),
    webhooksRequestSender = require('../webhooks/helpers/requestCreator'),
    testsRequestSender = require('../tests/helpers/requestCreator'),
    { WEBHOOK_EVENT_TYPE_STARTED, EVENT_FORMAT_TYPE_JSON } = require('../../../src/common/consts'),
    basicTest = require('../../testExamples/Basic_test.json'),
    nock = require('nock');

const { expect } = require('chai');
const { createJob } = require('../../../src/jobs/models/jobManager');

describe('Create job global tests', function () {
    this.timeout(20000);
    before(async () => {
        await schedulerRequestCreator.init();
        await webhooksRequestSender.init();
        await testsRequestSender.init();
    });

    beforeEach(async () => {
        nock.cleanAll();
    });

    describe('Bad requests', () => {
        it('Create a job without type should return error', () => {
            let illegalBody = {
                test_id: uuid.v4(),
                arrival_rate: 1,
                duration: 1,
                environment: 'test'
            };
            return schedulerRequestCreator.createJob(illegalBody, {
                'Content-Type': 'application/json'
            })
                .then(function (res) {
                    res.statusCode.should.eql(400);
                    res.body.should.eql({
                        message: 'Input validation error',
                        validation_errors: [
                            'body/type should be equal to one of the allowed values [load_test,functional_test]'
                            ]
                    });
                });
        });

        it('Create a job with a wrong type should return error', () => {
            let illegalBody = {
                test_id: uuid.v4(),
                arrival_rate: 1,
                duration: 1,
                environment: 'test',
                type: 'mickey'
            };
            return schedulerRequestCreator.createJob(illegalBody, {
                'Content-Type': 'application/json'
            })
                .then(function (res) {
                    res.statusCode.should.eql(400);
                    res.body.should.eql({
                        message: 'Input validation error',
                        validation_errors: [
                            'body/type should be equal to one of the allowed values [load_test,functional_test]'
                        ]
                    });
                });
        });

        it('Create a job with type load_test and arrival_count should return error', () => {
            let illegalBody = {
                test_id: uuid.v4(),
                arrival_count: 1,
                duration: 1,
                environment: 'test',
                type: 'load_test'
            };
            return schedulerRequestCreator.createJob(illegalBody, {
                'Content-Type': 'application/json'
            })
                .then(function (res) {
                    res.statusCode.should.eql(400);
                    res.body.should.eql({
                        message: 'Input validation error',
                        validation_errors: [
                            'body should have required property \'arrival_rate\''
                        ]
                    });
                });
        });

        it('Create a job with type functional_test and arrival_rate should return error', () => {
            let illegalBody = {
                test_id: uuid.v4(),
                arrival_rate: 1,
                duration: 1,
                environment: 'test',
                type: 'functional_test'
            };
            return schedulerRequestCreator.createJob(illegalBody, {
                'Content-Type': 'application/json'
            })
                .then(function (res) {
                    res.statusCode.should.eql(400);
                    res.body.should.eql({
                        message: 'Input validation error',
                        validation_errors: [
                            'body should have required property \'arrival_count\''
                        ]
                    });
                });
        });

        it('Create a job without run_immediately or cron_expression parameters, should return error', () => {
            let illegalBody = {
                test_id: uuid.v4(),
                arrival_rate: 1,
                duration: 1,
                environment: 'test',
                type: 'load_test'
            };
            return schedulerRequestCreator.createJob(illegalBody, {
                'Content-Type': 'application/json'
            })
                .then(function (res) {
                    res.statusCode.should.eql(400);
                    res.body.should.eql({ message: 'Please provide run_immediately or cron_expression in order to schedule a job' });
                });
        });

        it('Create a job without cron_expression with enable=false parameters, should return error', () => {
            let illegalBody = {
                test_id: uuid.v4(),
                arrival_rate: 1,
                duration: 1,
                environment: 'test',
                run_immediately: true,
                enabled: false,
                type: 'load_test'
            };
            return schedulerRequestCreator.createJob(illegalBody, {
                'Content-Type': 'application/json'
            })
                .then(function (res) {
                    res.statusCode.should.eql(400);
                    res.body.should.eql({ message: 'It is impossible to disable job without cron_expression' });
                });
        });

        it('Create a job with 0 duration, arrival_rate, max_virtual_users, ramp_to and parallelism should return error', () => {
            let illegalBody = {
                test_id: uuid.v4(),
                arrival_rate: 0,
                duration: 0,
                parallelism: 0,
                max_virtual_users: 0,
                ramp_to: 0,
                environment: 'test',
                type: 'load_test'
            };
            return schedulerRequestCreator.createJob(illegalBody, {
                'Content-Type': 'application/json'
            })
                .then(function (res) {
                    res.statusCode.should.eql(400);
                    res.body.should.eql({
                        'message': 'Input validation error',
                        'validation_errors': [
                            'body/arrival_rate should be >= 1',
                            'body/ramp_to should be >= 1',
                            'body/duration should be >= 1',
                            'body/max_virtual_users should be >= 1',
                            'body/parallelism should be >= 1'
                        ]
                    });
                });
        });

        it('Should return error for missing test_id', () => {
            let illegalBody = { arrival_rate: 1, duration: 1, environment: 'test', type: 'load_test' };
            return schedulerRequestCreator.createJob(illegalBody, {
                'Content-Type': 'application/json'
            })
                .then(function (res) {
                    res.statusCode.should.eql(400);
                    res.body.should.eql({
                        message: 'Input validation error',
                        validation_errors: ['body should have required property \'test_id\'']
                    });
                });
        });

        it('Should return error for illegal test_id', () => {
            let illegalBody = {
                test_id: 'string',
                arrival_rate: 1,
                run_immediately: true,
                duration: 1,
                environment: 'test',
                type: 'load_test'
            };
            return schedulerRequestCreator.createJob(illegalBody, {
                'Content-Type': 'application/json'
            })
                .then(function (res) {
                    res.statusCode.should.eql(400);
                    res.body.should.eql({
                        message: 'Input validation error',
                        validation_errors: ['body/test_id should match pattern "^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"']
                    });
                });
        });

        it('Should return error for missing arrival_rate', () => {
            let bodyWithoutTestId = { test_id: uuid.v4(), duration: 1, environment: 'test', type: 'load_test'};
            return schedulerRequestCreator.createJob(bodyWithoutTestId, {
                'Content-Type': 'application/json'
            })
                .then(function (res) {
                    res.statusCode.should.eql(400);
                    res.body.should.eql({
                        message: 'Input validation error',
                        validation_errors: ['body should have required property \'arrival_rate\'']
                    });
                });
        });

        it('Should return error for missing duration', () => {
            let illegalBody = { test_id: uuid.v4(), arrival_rate: 1, environment: 'test', type: 'load_test'};
            return schedulerRequestCreator.createJob(illegalBody, {
                'Content-Type': 'application/json'
            })
                .then(function (res) {
                    res.statusCode.should.eql(400);
                    res.body.should.eql({
                        message: 'Input validation error',
                        validation_errors: ['body should have required property \'duration\'']
                    });
                });
        });

        it('Create a job with non existing test_id', () => {
            let illegalBody = {
                test_id: '56ccc314-8c92-4002-839d-8424909ff475',
                arrival_rate: 1,
                duration: 1,
                environment: 'test',
                run_immediately: true,
                type: 'load_test'
            };
            return schedulerRequestCreator.createJob(illegalBody, {
                'Content-Type': 'application/json'
            })
                .then(function (res) {
                    res.statusCode.should.eql(400);
                    res.body.should.eql({ message: 'test with id: 56ccc314-8c92-4002-839d-8424909ff475 does not exist' });
                });
        });

        it('Get non existing job', async () => {
            let response = await schedulerRequestCreator.getJob(uuid.v4(), {
                'Content-Type': 'application/json'
            });
            should(response.statusCode).eql(404);
            should(response.body.message).eql('Not found');
        });

        it('Update non existing job', async () => {
            let response = await schedulerRequestCreator.updateJob(uuid.v4(), { arrival_rate: 100 }, {
                'Content-Type': 'application/json',
                'x-zooz-request-id': 1
            });
            should(response.statusCode).eql(404);
            should(response.body.message).eql('Not found');
        });

        describe('Create a job with a global webhook', () => {
            it('should return 422', async () => {
                const globalWebhook = {
                    name: 'Some webhook name',
                    url: 'https://predator.dev',
                    events: [WEBHOOK_EVENT_TYPE_STARTED],
                    global: true,
                    format_type: EVENT_FORMAT_TYPE_JSON
                };

                const job = {
                    arrival_rate: 1,
                    duration: 120,
                    environment: 'test',
                    run_immediately: true,
                    emails: [],
                    parallelism: 1,
                    max_virtual_users: 500
                };
                const headers = { 'Content-Type': 'application/json' };

                const webhookCreateResponse = await webhooksRequestSender.createWebhook(globalWebhook);
                expect(webhookCreateResponse.status).to.be.equal(201);
                const webhookId = webhookCreateResponse.body.id;

                const createTestResponse = await testsRequestSender.createTest(basicTest, headers);
                expect(createTestResponse.status).to.be.equal(201);
                const testId = createTestResponse.body.id;

                job.webhooks = [webhookId];
                job.test_id = testId;

                const createJobResponse = await schedulerRequestCreator.createJob(job, headers);
                expect(createJobResponse.status).to.be.equal(422);
                expect(createJobResponse.body.message).to.be.equal('Assigning a global webhook to a job is not allowed');
            });
        });
        describe('Update a job with a global webhook', () => {
            it('should return 422', async () => {
                const globalWebhook = {
                    name: 'Some webhook name',
                    url: 'https://predator.dev',
                    events: [WEBHOOK_EVENT_TYPE_STARTED],
                    global: true,
                    format_type: EVENT_FORMAT_TYPE_JSON
                };

                const job = {
                    arrival_rate: 1,
                    duration: 120,
                    environment: 'test',
                    run_immediately: false,
                    enabled: true,
                    cron_expression: '* * * 1 1',
                    webhooks: [],
                    emails: [],
                    parallelism: 1,
                    max_virtual_users: 500
                };
                const headers = { 'Content-Type': 'application/json' };

                const createTestResponse = await testsRequestSender.createTest(basicTest, headers);
                expect(createTestResponse.status).to.be.equal(201);
                const testId = createTestResponse.body.id;

                job.test_id = testId;

                const createJobResponse = await schedulerRequestCreator.createJob(job, headers);
                expect(createJobResponse.status).to.be.equal(201);
                const jobId = createJobResponse.body.id;

                const webhookCreateResponse = await webhooksRequestSender.createWebhook(globalWebhook);
                expect(webhookCreateResponse.status).to.be.equal(201);
                const webhookId = webhookCreateResponse.body.id;

                job.webhooks = [webhookId];

                const updateJobResponse = await schedulerRequestCreator.updateJob(jobId, job, headers);
                expect(updateJobResponse.status).to.be.equal(422);
                expect(updateJobResponse.body.message).to.be.equal('Assigning a global webhook to a job is not allowed');
            });
        });
    });
});
