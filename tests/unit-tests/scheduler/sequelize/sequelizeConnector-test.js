'use strict';
let sinon = require('sinon');
let rewire = require('rewire');
let should = require('should');
let databaseConfig = require('../../../../src/config/databaseConfig');
let sequelizeConnector = rewire('../../../../src/scheduler/models/database/sequelize/sequelizeConnector');

let uuid = require('uuid');

describe.skip('Sequelize client tests', function () {
    let sandbox;
    let sequelizeStub;
    let sequlizeAuthenticateStub;
    let sequlizeDefineStub;
    let sequlizeModelStub;
    let sequlizeCloseStub;
    let sequelizeCreateStub;
    let sequelizeUpdateStub;
    let sequelizeGetStub;
    let sequelizeDestroyStub;

    before(() => {
        sandbox = sinon.sandbox.create();
    });

    beforeEach(() => {
        databaseConfig.type = 'SQLITE';
        databaseConfig.name = 'predator';
        databaseConfig.username = 'username';
        databaseConfig.password = 'password';

        sequlizeAuthenticateStub = sandbox.stub();
        sequlizeDefineStub = sandbox.stub();
        sequelizeCreateStub = sandbox.stub();
        sequelizeUpdateStub = sandbox.stub();
        sequelizeGetStub = sandbox.stub();
        sequelizeDestroyStub = sandbox.stub();
        sequlizeModelStub = sandbox.stub();
        sequlizeCloseStub = sandbox.stub();
        sequelizeStub = sandbox.stub();
        sequlizeCloseStub = sandbox.stub();
        sequelizeStub = sandbox.stub();

        sequlizeDefineStub.returns({
            hasMany: () => {
            },
            sync: () => {
            }
        });

        sequlizeModelStub.returns({
            email: {},
            webhook: {},
            create: sequelizeCreateStub,
            update: sequelizeUpdateStub,
            findAll: sequelizeGetStub,
            destroy: sequelizeDestroyStub
        });

        sequelizeStub.returns({
            authenticate: sequlizeAuthenticateStub,
            model: sequlizeModelStub,
            define: sequlizeDefineStub,
            close: sequlizeCloseStub
        });
        sequelizeStub.DataTypes = {};
        sequelizeConnector.__set__('Sequelize', sequelizeStub);
        sequelizeConnector.__set__('uuid', () => {
            return 'UUIDSTUB';
        });
    });
    afterEach(() => {
        sandbox.resetHistory();
    });

    after(() => {
        sandbox.restore();
    });

    describe('Init and shutdown tests', () => {
        it('it should initialize sequelize with mysql client successfully', async () => {
            await sequelizeConnector.init();
            should(sequlizeAuthenticateStub.called).eql(true);
        });

        it('it should fail to initialize sequelize client', async () => {
            sequelizeStub.throws(new Error('Failed to init DB'));
            try {
                await sequelizeConnector.init();
            } catch (error) {
                should(error.message).equal('Failed to init DB');
            }
        });

        it('it should close sequelize client successfully with initialized client', async () => {
            sequlizeCloseStub.returns({});
            await sequelizeConnector.init();

            sequelizeConnector.closeConnection();

            should(sequlizeCloseStub.called).eql(true);
        });
    });

    describe('Ping tests', function () {
        it('ping is ok, sequelize is up', async () => {
            await sequelizeConnector.init();
            await sequelizeConnector.ping();
            should(sequlizeAuthenticateStub.called).eql(true);
        });

        it('ping rejects as auth failed, sequelize is down', async () => {
            await sequelizeConnector.init();

            sequlizeAuthenticateStub.rejects(new Error('Auth failed'));

            try {
                await sequelizeConnector.ping();
                throw new Error('Should not get here');
            } catch (error) {
                should(error.message).eql('Error occurred in communication with database: Auth failed');
            }
        });
    });

    describe('Insert new jobs', () => {
        it('should succeed full insert', async () => {
            await sequelizeConnector.init();

            let id = uuid.v4();
            let testId = uuid.v4();

            await sequelizeConnector.insertJob(id, {
                test_id: testId,
                arrival_rate: 1,
                duration: 1,
                cron_expression: '* * * *',
                emails: ['hello@zooz.com', 'hello@payu.com'],
                environment: 'test',
                ramp_to: '1',
                webhooks: ['http://zooz.com', 'http://payu.com']
            });

            should(sequelizeCreateStub.args[0][0]).eql({
                'id': id,
                'test_id': testId,
                'arrival_rate': 1,
                'cron_expression': '* * * *',
                'duration': 1,
                'environment': 'test',
                'ramp_to': '1',
                'webhooks': [{
                    'id': 'UUIDSTUB',
                    'url': 'http://zooz.com'
                }, {
                    'id': 'UUIDSTUB',
                    'url': 'http://payu.com'
                }],
                'emails': [{
                    'id': 'UUIDSTUB',
                    'address': 'hello@zooz.com'
                }, {
                    'id': 'UUIDSTUB',
                    'address': 'hello@payu.com'
                }]
            });
        });

        it('should succeed insert without webhooks and emails', async () => {
            await sequelizeConnector.init();

            let id = uuid.v4();
            let testId = uuid.v4();

            await sequelizeConnector.insertJob(id, {
                test_id: testId,
                arrival_rate: 1,
                duration: 1,
                cron_expression: '* * * *',
                environment: 'test',
                ramp_to: '1'
            });

            should(sequelizeCreateStub.args[0][0]).eql({
                'id': id,
                'test_id': testId,
                'arrival_rate': 1,
                'cron_expression': '* * * *',
                'duration': 1,
                'environment': 'test',
                'ramp_to': '1',
                'webhooks': undefined,
                'emails': undefined
            });
        });

        it('should log error for failing inserting new test', async () => {
            sequelizeCreateStub.rejects(new Error('Sequelize Error'));

            await sequelizeConnector.init();

            try {
                await sequelizeConnector.insertJob(uuid.v4(), {
                    test_id: uuid.v4(),
                    arrival_rate: 1,
                    duration: 1,
                    cron_expression: '* * * *',
                    environment: 'test',
                    ramp_to: '1'
                });
                throw new Error('Should not get here');
            } catch (error) {
                should(error.message).eql('Sequelize Error');
            }
        });
    });

    describe('Get jobs', () => {
        it('should get multiple jobs', async () => {
            await sequelizeConnector.init();

            let sequelizeResponse = [{
                dataValues: {
                    'id': 'd6b0f076-2efb-48e1-82d2-82250818f59c',
                    'test_id': 'e2340c63-7828-4b69-b79d-6cbea8fec7a6',
                    'environment': 'test',
                    'cron_expression': null,
                    'arrival_rate': 100,
                    'duration': 1700,
                    'ramp_to': null,
                    'webhooks': [{
                        dataValues: {
                            'id': '8138e406-0d5f-4caf-a143-a758b9545b75',
                            'url': 'https://hooks.slack.com/services/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',
                            'created_at': '2019-01-20T12:56:31.000Z',
                            'updated_at': '2019-01-20T12:56:31.000Z',
                            'job_id': 'd6b0f076-2efb-48e1-82d2-82250818f59c'
                        }
                    }, {
                        dataValues: {
                            'id': 'e38b985f-efec-4315-93bf-6f04eb2b7438',
                            'url': 'http://www.one.com',
                            'created_at': '2019-01-20T12:56:31.000Z',
                            'updated_at': '2019-01-20T12:56:31.000Z',
                            'job_id': 'd6b0f076-2efb-48e1-82d2-82250818f59c'
                        }
                    }],
                    'emails': [{
                        dataValues: {
                            'id': '8bd6a285-9d9f-4e07-a8e3-387f5936c347',
                            'address': 'eli.nudler@zooz.com',
                            'created_at': '2019-01-20T12:56:31.000Z',
                            'updated_at': '2019-01-20T12:56:31.000Z',
                            'job_id': 'd6b0f076-2efb-48e1-82d2-82250818f59c'
                        }
                    }, {
                        dataValues: {
                            'id': 'edc77399-ea72-4b0a-97da-c6169e59bb52',
                            'address': 'xyz@om.ds',
                            'created_at': '2019-01-20T12:56:31.000Z',
                            'updated_at': '2019-01-20T12:56:31.000Z',
                            'job_id': 'd6b0f076-2efb-48e1-82d2-82250818f59c'
                        }
                    }]
                }
            }, {
                dataValues: {
                    'id': 'd6b0f076-2efb-48e1-82d2-82250818f59d',
                    'test_id': 'e2340c63-7828-4b69-b79d-6cbea8fec7a7',
                    'environment': 'test',
                    'cron_expression': null,
                    'arrival_rate': 200,
                    'duration': 2000,
                    'ramp_to': null
                }
            }];

            sequelizeGetStub.resolves(sequelizeResponse);
            let jobs = await sequelizeConnector.getJobs();

            should(jobs.length).eql(2);
            should(jobs[0]).eql({
                'arrival_rate': 100,
                'cron_expression': null,
                'duration': 1700,
                'emails': [
                    'eli.nudler@zooz.com',
                    'xyz@om.ds'
                ],
                'environment': 'test',
                'id': 'd6b0f076-2efb-48e1-82d2-82250818f59c',
                'ramp_to': null,
                'test_id': 'e2340c63-7828-4b69-b79d-6cbea8fec7a6',
                'webhooks': [
                    'https://hooks.slack.com/services/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',
                    'http://www.one.com'
                ]
            });
            should(jobs[1]).eql({
                'arrival_rate': 200,
                'cron_expression': null,
                'duration': 2000,
                'environment': 'test',
                'id': 'd6b0f076-2efb-48e1-82d2-82250818f59d',
                'ramp_to': null,
                'test_id': 'e2340c63-7828-4b69-b79d-6cbea8fec7a7',
                'webhooks': undefined,
                'emails': undefined
            });
        });

        it('should get multiple jobs - no jobs exists', async () => {
            await sequelizeConnector.init();

            let sequelizeResponse = [];

            sequelizeGetStub.resolves(sequelizeResponse);
            let jobs = await sequelizeConnector.getJobs();

            should(jobs.length).eql(0);
        });

        it('should get failure from sequelize', async () => {
            await sequelizeConnector.init();

            sequelizeGetStub.rejects(new Error('db error'));

            try {
                await sequelizeConnector.getJobs();
                throw new Error('should not get here');
            } catch (error) {
                should(error.message).equal('db error');
            }
        });
    });

    describe('Get single job', async () => {
        it('should get single job', async () => {
            await sequelizeConnector.init();

            let sequelizeResponse = [{
                dataValues: {
                    'id': 'd6b0f076-2efb-48e1-82d2-82250818f59c',
                    'test_id': 'e2340c63-7828-4b69-b79d-6cbea8fec7a6',
                    'environment': 'test',
                    'cron_expression': null,
                    'arrival_rate': 100,
                    'duration': 1700,
                    'ramp_to': null,
                    'webhooks': [{
                        dataValues: {
                            'id': '8138e406-0d5f-4caf-a143-a758b9545b75',
                            'url': 'https://hooks.slack.com/services/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',
                            'created_at': '2019-01-20T12:56:31.000Z',
                            'updated_at': '2019-01-20T12:56:31.000Z',
                            'job_id': 'd6b0f076-2efb-48e1-82d2-82250818f59c'
                        }
                    }, {
                        dataValues: {
                            'id': 'e38b985f-efec-4315-93bf-6f04eb2b7438',
                            'url': 'http://www.one.com',
                            'created_at': '2019-01-20T12:56:31.000Z',
                            'updated_at': '2019-01-20T12:56:31.000Z',
                            'job_id': 'd6b0f076-2efb-48e1-82d2-82250818f59c'
                        }
                    }],
                    'emails': [{
                        dataValues: {
                            'id': '8bd6a285-9d9f-4e07-a8e3-387f5936c347',
                            'address': 'eli.nudler@zooz.com',
                            'created_at': '2019-01-20T12:56:31.000Z',
                            'updated_at': '2019-01-20T12:56:31.000Z',
                            'job_id': 'd6b0f076-2efb-48e1-82d2-82250818f59c'
                        }
                    }, {
                        dataValues: {
                            'id': 'edc77399-ea72-4b0a-97da-c6169e59bb52',
                            'address': 'xyz@om.ds',
                            'created_at': '2019-01-20T12:56:31.000Z',
                            'updated_at': '2019-01-20T12:56:31.000Z',
                            'job_id': 'd6b0f076-2efb-48e1-82d2-82250818f59c'
                        }
                    }]
                }
            }];

            sequelizeGetStub.resolves(sequelizeResponse);
            let jobs = await sequelizeConnector.getJob('d6b0f076-2efb-48e1-82d2-82250818f59c');

            should(jobs).eql([{
                'arrival_rate': 100,
                'cron_expression': null,
                'duration': 1700,
                'emails': [
                    'eli.nudler@zooz.com',
                    'xyz@om.ds'
                ],
                'environment': 'test',
                'id': 'd6b0f076-2efb-48e1-82d2-82250818f59c',
                'ramp_to': null,
                'test_id': 'e2340c63-7828-4b69-b79d-6cbea8fec7a6',
                'webhooks': [
                    'https://hooks.slack.com/services/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',
                    'http://www.one.com'
                ]
            }]);

            should(sequelizeGetStub.args[0][0]).eql({
                'attributes': {
                    'exclude': [
                        'updated_at',
                        'created_at'
                    ]
                },
                'include': [
                    {},
                    {}
                ],
                'where': {
                    'id': 'd6b0f076-2efb-48e1-82d2-82250818f59c'
                }
            });
        });

        it('should return empty response as no such job id exists', async () => {
            await sequelizeConnector.init();

            let sequelizeResponse = [];

            sequelizeGetStub.resolves(sequelizeResponse);
            let jobs = await sequelizeConnector.getJob('d6b0f076-2efb-48e1-82d2-82250818f59c');

            should(jobs).eql([]);
        });

        it('should get failure from sequelize', async () => {
            await sequelizeConnector.init();

            sequelizeGetStub.rejects(new Error('db error'));

            try {
                await sequelizeConnector.getJob('d6b0f076-2efb-48e1-82d2-82250818f59c');
                throw new Error('should not get here');
            } catch (error) {
                should(error.message).equal('db error');
            }
        });
    });

    describe('Delete job', function () {
        it('should delete single job', async () => {
            await sequelizeConnector.init();
            sequelizeDestroyStub.resolves();
            await sequelizeConnector.deleteJob('jobId');

            should(sequelizeDestroyStub.args[0][0]).eql({
                'where': {
                    'id': 'jobId'
                }
            });
        });

        it('should get failure from sequelize', async () => {
            await sequelizeConnector.init();
            sequelizeDestroyStub.rejects(new Error('delete error'));
            try {
                await sequelizeConnector.deleteJob('jobId');
                throw new Error('should not get here');
            } catch (error) {
                should(error.message).eql('delete error');
            }
        });
    });

    describe('Update new jobs', () => {
        it('should succeed updating job', async () => {
            await sequelizeConnector.init();

            let id = uuid.v4();
            let testId = uuid.v4();

            await sequelizeConnector.updateJob(id, {
                test_id: testId,
                arrival_rate: 1,
                duration: 1,
                cron_expression: '* * * *',
                environment: 'test',
                ramp_to: '1'
            });

            should(sequelizeUpdateStub.args[0][0]).eql({
                'test_id': testId,
                'arrival_rate': 1,
                'cron_expression': '* * * *',
                'duration': 1,
                'environment': 'test',
                'ramp_to': '1'
            });

            should(sequelizeUpdateStub.args[0][1]).eql({
                'where': {
                    'id': id
                }
            });
        });

        it('should log error for failing updating  test', async () => {
            sequelizeUpdateStub.rejects(new Error('Sequelize Error'));

            await sequelizeConnector.init();

            try {
                await sequelizeConnector.updateJob(uuid.v4(), {
                    test_id: uuid.v4(),
                    arrival_rate: 1,
                    duration: 1,
                    cron_expression: '* * * *',
                    environment: 'test',
                    ramp_to: '1'
                });
                throw new Error('Should not get here');
            } catch (error) {
                should(error.message).eql('Sequelize Error');
            }
        });
    });
});