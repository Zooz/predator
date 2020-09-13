'use strict';
let sinon = require('sinon');
let rewire = require('rewire');
let should = require('should');
const cloneDeep = require('lodash/cloneDeep');

let databaseConfig = require('../../../../src/config/databaseConfig');
let sequelizeConnector = rewire('../../../../src/jobs/models/database/sequelize/sequelizeConnector');

let uuid = require('uuid');

describe('Sequelize client tests', function () {
    let sandbox;
    let sequelizeStub;
    let sequelizeAuthenticateStub;
    let sequelizeDefineStub;
    let sequelizeModelStub;
    let sequelizeCloseStub;
    let sequelizeCreateStub;
    let sequelizeUpdateStub;
    let sequelizeGetStub;
    let sequelizeDestroyStub;
    let sequelizeTransactionStub;
    let setWebhooksStub;
    const transaction = {};

    before(() => {
        sandbox = sinon.sandbox.create();
    });

    beforeEach(() => {
        databaseConfig.type = 'SQLITE';
        databaseConfig.name = 'predator';
        databaseConfig.username = 'username';
        databaseConfig.password = 'password';

        sequelizeAuthenticateStub = sandbox.stub();
        sequelizeDefineStub = sandbox.stub();
        sequelizeCreateStub = sandbox.stub();
        sequelizeUpdateStub = sandbox.stub();
        sequelizeGetStub = sandbox.stub();
        sequelizeDestroyStub = sandbox.stub();
        sequelizeModelStub = sandbox.stub();
        sequelizeCloseStub = sandbox.stub();
        sequelizeStub = sandbox.stub();
        sequelizeCloseStub = sandbox.stub();
        sequelizeTransactionStub = sandbox.stub();
        setWebhooksStub = sandbox.stub();

        sequelizeDefineStub.returns({
            hasMany: () => {
            },
            sync: () => {
            },
            belongsToMany: () => {}
        });

        sequelizeModelStub.returns({
            email: {},
            webhook: {},
            belongsToMany: () => {},
            create: sequelizeCreateStub,
            update: sequelizeUpdateStub,
            findAll: sequelizeGetStub,
            destroy: sequelizeDestroyStub,
            findByPk: sequelizeGetStub
        });

        sequelizeStub.returns({
            authenticate: sequelizeAuthenticateStub,
            model: sequelizeModelStub,
            define: sequelizeDefineStub,
            close: sequelizeCloseStub,
            transaction: sequelizeTransactionStub
        });
        sequelizeStub.DataTypes = {};
        sequelizeConnector.__set__('Sequelize', sequelizeStub);
        sequelizeConnector.__set__('uuid', () => {
            return 'UUIDSTUB';
        });
    });
    afterEach(() => {
        sandbox.resetHistory();
        sandbox.resetBehavior();
    });

    after(() => {
        sandbox.restore();
    });

    describe('Init tests', () => {
        it('it should initialize sequelize with mysql client successfully', async () => {
            await sequelizeConnector.init(sequelizeStub());
            should(sequelizeDefineStub.calledTwice).eql(true);
        });
    });

    describe('Insert new jobs', () => {
        it('should succeed full insert', async () => {
            await sequelizeConnector.init(sequelizeStub());

            let id = uuid.v4();
            let testId = uuid.v4();

            const job = {
                test_id: testId,
                arrival_rate: 1,
                duration: 1,
                type: 'load_test',
                cron_expression: '* * * *',
                emails: ['hello@zooz.com', 'hello@payu.com'],
                environment: 'test',
                ramp_to: '1',
                webhooks: ['UUIDSTUB'],
                parallelism: 4,
                max_virtual_users: 100,
                notes: 'some nice notes',
                proxy_url: 'http://proxy.com',
                debug: '*',
                enabled: true
            };
            const createdJob = {
                dataValues: {
                    ...job,
                    id,
                    webhooks: ['UUIDSTUB'],
                    emails: [{
                        'id': 'UUIDSTUB',
                        'address': 'hello@zooz.com'
                    }, {
                        'id': 'UUIDSTUB',
                        'address': 'hello@payu.com'
                    }]
                },
                setWebhooks: sandbox.stub()
            };

            createdJob.setWebhooks.resolves();
            sequelizeCreateStub.resolves(createdJob);
            sequelizeTransactionStub.resolves(createdJob);

            await sequelizeConnector.insertJob(id, job);
            await sequelizeTransactionStub.yield(transaction);

            const jobParams = cloneDeep(job);
            jobParams.emails = createdJob.dataValues.emails;
            jobParams.id = createdJob.dataValues.id;
            delete jobParams.webhooks;

            should(sequelizeCreateStub.args[0][0]).deepEqual(jobParams);
            should(createdJob.setWebhooks.calledOnce).eql(true);
            should(createdJob.setWebhooks.args[0][0]).deepEqual(job.webhooks);
        });

        it('should succeed insert without webhooks and emails', async () => {
            await sequelizeConnector.init(sequelizeStub());

            let id = uuid.v4();
            let testId = uuid.v4();

            const job = {
                test_id: testId,
                arrival_rate: 1,
                type: 'load_test',
                duration: 1,
                cron_expression: '* * * *',
                environment: 'test',
                ramp_to: '1',
                enabled: true,
                parallelism: 4,
                max_virtual_users: 100,
                notes: 'some notes',
                proxy_url: 'http://proxy.com',
                debug: '*'
            };

            const createdJob = {
                dataValues: {
                    ...job,
                    id
                },
                setWebhooks: sandbox.stub()
            };

            sequelizeCreateStub.resolves(createdJob);
            createdJob.setWebhooks.resolves();
            sequelizeTransactionStub.resolves();

            await sequelizeConnector.insertJob(id, job);
            await sequelizeTransactionStub.yield(transaction);

            const jobParams = cloneDeep(job);
            jobParams.emails = createdJob.dataValues.emails;
            jobParams.id = createdJob.dataValues.id;

            should(sequelizeCreateStub.args[0][0]).eql(jobParams);
            should(createdJob.setWebhooks.calledOnce).eql(true);
            should(createdJob.setWebhooks.args[0][0]).deepEqual([]);
        });

        it('should log error for failing inserting new test', async () => {
            sequelizeTransactionStub.rejects(new Error('Sequelize Error'));

            await sequelizeConnector.init(sequelizeStub());

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
            await sequelizeConnector.init(sequelizeStub());

            let sequelizeResponse = [{
                dataValues: {
                    id: 'd6b0f076-2efb-48e1-82d2-82250818f59c',
                    test_id: 'e2340c63-7828-4b69-b79d-6cbea8fec7a6',
                    environment: 'test',
                    cron_expression: null,
                    arrival_rate: 100,
                    duration: 1700,
                    ramp_to: null,
                    webhooks: [
                        {
                            dataValues: {
                                id: '8138e406-0d5f-4caf-a143-a758b9545b75',
                                name: 'avi3',
                                url: 'https://1f19d804b781f93bfe92e6dac1b96572.m.pipedream.net',
                                global: false,
                                format_type: 'json',
                                created_at: '2020-08-10T20:37:49.313Z',
                                updated_at: '2020-08-10T20:37:49.313Z',
                                webhook_job_mapping: {
                                    created_at: '2020-08-11T16:12:35.634Z',
                                    updated_at: '2020-08-11T16:12:35.634Z',
                                    webhook_id: '04e844d6-c0c4-46e9-a752-ba66035e047c',
                                    job_id: 'c941ea0f-7b3d-4b05-a01a-7961c7735e04'
                                }
                            }
                        },
                        {
                            dataValues: {
                                id: 'e38b985f-efec-4315-93bf-6f04eb2b7438',
                                name: 'avi',
                                url: 'https://1f19d804b781f93bfe92e6dac1b96572.m.pipedream.net',
                                global: false,
                                format_type: 'json',
                                created_at: '2020-08-10T20:10:26.573Z',
                                updated_at: '2020-08-10T20:10:26.573Z',
                                webhook_job_mapping: {
                                    created_at: '2020-08-11T16:12:35.634Z',
                                    updated_at: '2020-08-11T16:12:35.634Z',
                                    webhook_id: '5a862394-6e13-45e0-a478-7cd069a2d438',
                                    job_id: 'c941ea0f-7b3d-4b05-a01a-7961c7735e04'
                                }
                            }
                        }
                    ],
                    emails: [{
                        dataValues: {
                            id: '8bd6a285-9d9f-4e07-a8e3-387f5936c347',
                            address: 'eli.nudler@zooz.com',
                            created_at: '2019-01-20T12:56:31.000Z',
                            updated_at: '2019-01-20T12:56:31.000Z',
                            job_id: 'd6b0f076-2efb-48e1-82d2-82250818f59c'
                        }
                    }, {
                        dataValues: {
                            id: 'edc77399-ea72-4b0a-97da-c6169e59bb52',
                            address: 'xyz@om.ds',
                            created_at: '2019-01-20T12:56:31.000Z',
                            updated_at: '2019-01-20T12:56:31.000Z',
                            job_id: 'd6b0f076-2efb-48e1-82d2-82250818f59c'
                        }
                    }]
                }
            }, {
                dataValues: {
                    id: 'd6b0f076-2efb-48e1-82d2-82250818f59d',
                    test_id: 'e2340c63-7828-4b69-b79d-6cbea8fec7a7',
                    environment: 'test',
                    cron_expression: null,
                    arrival_rate: 200,
                    duration: 2000,
                    ramp_to: null
                }
            }];

            sequelizeGetStub.resolves(sequelizeResponse);
            let jobs = await sequelizeConnector.getJobs();

            should(jobs.length).eql(2);
            should(jobs[0]).eql({
                arrival_rate: 100,
                cron_expression: null,
                duration: 1700,
                emails: [
                    'eli.nudler@zooz.com',
                    'xyz@om.ds'
                ],
                environment: 'test',
                id: 'd6b0f076-2efb-48e1-82d2-82250818f59c',
                ramp_to: null,
                test_id: 'e2340c63-7828-4b69-b79d-6cbea8fec7a6',
                webhooks: [
                    '8138e406-0d5f-4caf-a143-a758b9545b75',
                    'e38b985f-efec-4315-93bf-6f04eb2b7438'
                ]
            });
            should(jobs[1]).eql({
                arrival_rate: 200,
                cron_expression: null,
                duration: 2000,
                environment: 'test',
                id: 'd6b0f076-2efb-48e1-82d2-82250818f59d',
                ramp_to: null,
                test_id: 'e2340c63-7828-4b69-b79d-6cbea8fec7a7',
                webhooks: undefined,
                emails: undefined
            });
        });

        it('should get multiple jobs - no jobs exists', async () => {
            await sequelizeConnector.init(sequelizeStub());

            let sequelizeResponse = [];

            sequelizeGetStub.resolves(sequelizeResponse);
            let jobs = await sequelizeConnector.getJobs();

            should(jobs.length).eql(0);
        });

        it('should get failure from sequelize', async () => {
            await sequelizeConnector.init(sequelizeStub());

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
            await sequelizeConnector.init(sequelizeStub());

            let sequelizeResponse = [{
                dataValues: {
                    id: 'd6b0f076-2efb-48e1-82d2-82250818f59c',
                    test_id: 'e2340c63-7828-4b69-b79d-6cbea8fec7a6',
                    environment: 'test',
                    cron_expression: null,
                    arrival_rate: 100,
                    duration: 1700,
                    ramp_to: null,
                    webhooks: [{
                        dataValues: {
                            id: '8138e406-0d5f-4caf-a143-a758b9545b75',
                            url: 'https://hooks.slack.com/services/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',
                            created_at: '2019-01-20T12:56:31.000Z',
                            updated_at: '2019-01-20T12:56:31.000Z',
                            job_id: 'd6b0f076-2efb-48e1-82d2-82250818f59c'
                        }
                    }, {
                        dataValues: {
                            id: 'e38b985f-efec-4315-93bf-6f04eb2b7438',
                            url: 'http://www.one.com',
                            created_at: '2019-01-20T12:56:31.000Z',
                            updated_at: '2019-01-20T12:56:31.000Z',
                            job_id: 'd6b0f076-2efb-48e1-82d2-82250818f59c'
                        }
                    }],
                    emails: [{
                        dataValues: {
                            id: '8bd6a285-9d9f-4e07-a8e3-387f5936c347',
                            address: 'eli.nudler@zooz.com',
                            created_at: '2019-01-20T12:56:31.000Z',
                            updated_at: '2019-01-20T12:56:31.000Z',
                            job_id: 'd6b0f076-2efb-48e1-82d2-82250818f59c'
                        }
                    }, {
                        dataValues: {
                            id: 'edc77399-ea72-4b0a-97da-c6169e59bb52',
                            address: 'xyz@om.ds',
                            created_at: '2019-01-20T12:56:31.000Z',
                            updated_at: '2019-01-20T12:56:31.000Z',
                            job_id: 'd6b0f076-2efb-48e1-82d2-82250818f59c'
                        }
                    }]
                }
            }];

            sequelizeGetStub.resolves(sequelizeResponse);
            let jobs = await sequelizeConnector.getJob('d6b0f076-2efb-48e1-82d2-82250818f59c');

            should(jobs).eql([{
                arrival_rate: 100,
                cron_expression: null,
                duration: 1700,
                emails: [
                    'eli.nudler@zooz.com',
                    'xyz@om.ds'
                ],
                environment: 'test',
                id: 'd6b0f076-2efb-48e1-82d2-82250818f59c',
                ramp_to: null,
                test_id: 'e2340c63-7828-4b69-b79d-6cbea8fec7a6',
                webhooks: [
                    '8138e406-0d5f-4caf-a143-a758b9545b75',
                    'e38b985f-efec-4315-93bf-6f04eb2b7438'
                ]
            }]);

            should(sequelizeGetStub.args[0][0]).eql({
                attributes: {
                    exclude: [
                        'updated_at',
                        'created_at'
                    ]
                },
                include: [
                    {},
                    'webhooks'
                ],
                where: {
                    id: 'd6b0f076-2efb-48e1-82d2-82250818f59c'
                }
            });
        });

        it('should return empty response as no such job id exists', async () => {
            await sequelizeConnector.init(sequelizeStub());

            let sequelizeResponse = [];

            sequelizeGetStub.resolves(sequelizeResponse);
            let jobs = await sequelizeConnector.getJob('d6b0f076-2efb-48e1-82d2-82250818f59c');

            should(jobs).eql([]);
        });

        it('should get failure from sequelize', async () => {
            await sequelizeConnector.init(sequelizeStub());

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
            await sequelizeConnector.init(sequelizeStub());
            sequelizeDestroyStub.resolves();
            await sequelizeConnector.deleteJob('jobId');

            should(sequelizeDestroyStub.args[0][0]).eql({
                'where': {
                    'id': 'jobId'
                }
            });
        });

        it('should get failure from sequelize', async () => {
            await sequelizeConnector.init(sequelizeStub());
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
        let id, testId;
        beforeEach(async function() {
            id = uuid.v4();
            testId = uuid.v4();
        });
        it('should succeed updating job with type load_test', async () => {
            const webhookId = uuid.v4();
            await sequelizeConnector.init(sequelizeStub());

            const sequelizeJobResponse = {
                dataValues: {
                    type: 'load_test',
                    test_id: testId,
                    arrival_rate: 100,
                    arrival_count: null,
                    duration: 1,
                    cron_expression: '* * * *',
                    environment: 'test',
                    ramp_to: null,
                    max_virtual_users: 500,
                    parallelism: 3,
                    proxy_url: 'http://proxy.com',
                    debug: '*',
                    enabled: false
                },
                setWebhooks: sandbox.stub()
            };
            const updatedJobInfo = {
                ...sequelizeJobResponse.dataValues,
                cron_expression: '5 4 * *',
                proxy_url: 'http://predator.dev',
                webhooks: [ webhookId ]
            };
            sequelizeGetStub.resolves(sequelizeJobResponse);
            sequelizeTransactionStub.resolves();
            sequelizeJobResponse.setWebhooks.resolves();

            await sequelizeConnector.updateJob(id, updatedJobInfo);
            await sequelizeTransactionStub.yield(transaction);

            const { webhooks, ...updatedJobInfoWithoutWebhooks } = updatedJobInfo;

            should(sequelizeUpdateStub.args[0][0]).eql(updatedJobInfoWithoutWebhooks);
            should(sequelizeUpdateStub.args[0][1]).eql({ where: { id }, transaction });
        });

        it('should succeed updating load_test job to functional_test job', async () => {
            const sequelizeJob = {
                dataValues: {
                    id,
                    test_id: testId,
                    type: 'load_test',
                    environment: 'test',
                    cron_expression: null,
                    arrival_rate: 100,
                    duration: 1700,
                    ramp_to: null,
                    webhooks: [],
                    emails: []
                },
                setWebhooks: setWebhooksStub
            };
            const updatedJob = {
                test_id: testId,
                type: 'functional_test',
                arrival_count: 5,
                arrival_rate: 1,
                duration: 1,
                cron_expression: '* * * *',
                environment: 'test',
                ramp_to: '1',
                max_virtual_users: 500,
                parallelism: 3,
                proxy_url: 'http://proxy.com',
                debug: '*',
                enabled: false
            };
            const updatedJobRes = {
                test_id: testId,
                type: 'functional_test',
                arrival_count: 5,
                arrival_rate: null,
                cron_expression: '* * * *',
                duration: 1,
                environment: 'test',
                ramp_to: null,
                max_virtual_users: 500,
                parallelism: 3,
                proxy_url: 'http://proxy.com',
                debug: '*',
                enabled: false,
                webhooks: [],
                emails: []
            };
            const transaction = {};
            sequelizeGetStub.resolves(sequelizeJob);
            sequelizeTransactionStub.resolves(updatedJob);
            setWebhooksStub.resolves();
            await sequelizeConnector.init(sequelizeStub());

            await sequelizeConnector.updateJob(id, updatedJob);
            await sequelizeTransactionStub.yield(transaction);

            should(sequelizeUpdateStub.args[0][0]).eql(updatedJobRes);

            should(sequelizeUpdateStub.args[0][1]).eql({ where: { id }, transaction });
        });

        it('should log error for failing updating  test', async () => {
            sequelizeGetStub.rejects(new Error('Sequelize Error'));

            await sequelizeConnector.init(sequelizeStub());

            try {
                await sequelizeConnector.updateJob(id, {
                    test_id: testId,
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
