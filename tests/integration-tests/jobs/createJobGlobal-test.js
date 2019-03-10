const should = require('should'),
    uuid = require('uuid'),
    schedulerRequestCreator = require('./helpers/requestCreator'),
    nock = require('nock');

describe('Create job global tests', function () {
    this.timeout(20000);
    before(async () => {
        await schedulerRequestCreator.init();
    });

    beforeEach(async () => {
        nock.cleanAll();
    });

    describe('Bad requests', () => {
        it('Create a job without run_immediately or cron_expression parameters, should return error', () => {
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
                    res.body.should.eql({ message: 'Please provide run_immediately or cron_expression in order to schedule a job' });
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
                environment: 'test'
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
                            'body/duration should be >= 1',
                            'body/ramp_to should be >= 1',
                            'body/max_virtual_users should be >= 1',
                            'body/parallelism should be >= 1'] });
                });
        });

        it('Should return error for missing test_id', () => {
            let illegalBody = { arrival_rate: 1, duration: 1, environment: 'test' };
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
                environment: 'test'
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
            let bodyWithoutTestId = { test_id: uuid.v4(), duration: 1, environment: 'test' };
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
            let illegalBody = { test_id: uuid.v4(), arrival_rate: 1, environment: 'test', 'is_use_akamai': true };
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
                run_immediately: true
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
    });
});