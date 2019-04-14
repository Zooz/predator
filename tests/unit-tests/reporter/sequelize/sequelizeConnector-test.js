'use strict';
let sinon = require('sinon');
let rewire = require('rewire');
let should = require('should');
let databaseConfig = require('../../../../src/config/databaseConfig');
let sequelizeConnector = rewire('../../../../src/reports/models/database/sequelize/sequelizeConnector');
let uuid = require('uuid');

describe('Sequelize client tests', function () {
    let sandbox;
    let sequelizeStub;
    let sequelizeAuthenticateStub;
    let sequelizeDefineStub;
    let sequelizeModelStub;
    let sequelizeCloseStub;
    let sequelizeFindOrCreateStub;
    let sequelizeInsertStatsStub;
    let sequelizeUpdateStub;
    let sequelizeGetStub;
    let sequelizeDestroyStub;
    let sequelizeCreateSubscriberStatsStub;
    let sequelizeGetSubscribersStatsStub;

    let reportId;
    let testId;
    let jobId;
    let revisionId;
    let testType;
    let startTime;
    let testName;
    let testDescription;
    let testConfiguration;
    let notes;
    let lastStats = JSON.stringify({});
    let subscribers = [{
        dataValues: {
            runner_id: '12345',
            phase_status: 'done',
            last_stats: lastStats
        }
    }];

    before(() => {
        sandbox = sinon.sandbox.create();
    });

    beforeEach(async () => {
        databaseConfig.type = 'SQLITE';
        databaseConfig.name = 'predator';
        databaseConfig.username = 'username';
        databaseConfig.password = 'password';

        sequelizeAuthenticateStub = sandbox.stub();
        sequelizeDefineStub = sandbox.stub();
        sequelizeFindOrCreateStub = sandbox.stub();
        sequelizeUpdateStub = sandbox.stub();
        sequelizeGetStub = sandbox.stub();
        sequelizeDestroyStub = sandbox.stub();
        sequelizeModelStub = sandbox.stub();
        sequelizeCloseStub = sandbox.stub();
        sequelizeStub = sandbox.stub();
        sequelizeInsertStatsStub = sandbox.stub();
        sequelizeCreateSubscriberStatsStub = sandbox.stub();
        sequelizeGetSubscribersStatsStub = sandbox.stub();

        sequelizeDefineStub.returns({
            sync: () => {
            },
            hasMany: () => {
            },
            save: () => {
            }
        });

        sequelizeModelStub.returns({
            findOrCreate: sequelizeFindOrCreateStub,
            create: sequelizeInsertStatsStub,
            update: sequelizeUpdateStub,
            findAll: sequelizeGetStub,
            destroy: sequelizeDestroyStub,
            subscriber: {}
        });

        sequelizeStub.returns({
            authenticate: sequelizeAuthenticateStub,
            model: sequelizeModelStub,
            define: sequelizeDefineStub,
            close: sequelizeCloseStub
        });
        sequelizeStub.DataTypes = {
            TEXT: () => {
            }
        };
        sequelizeConnector.__set__('Sequelize', sequelizeStub);

        reportId = uuid.v4();
        testId = uuid.v4();
        jobId = uuid.v4();
        revisionId = uuid.v4();
        testType = 'basic';
        startTime = Date.now();
        testName = 'unit-test';
        testDescription = 'desc';
        testConfiguration = JSON.stringify({environment: 'test'});
        notes = 'some notes';
        await sequelizeConnector.init(sequelizeStub());
    });

    afterEach(() => {
        sandbox.resetHistory();
    });

    after(() => {
        sandbox.restore();
    });

    describe('Init tests', () => {
        it('it should initialize sequelize with mysql client successfully', async () => {
            await sequelizeConnector.init(sequelizeStub());
        });
    });

    describe('Insert new report', () => {
        it('should succeed full insert', async () => {
            const lastUpdateAt = Date.now();
            await sequelizeConnector.insertReport(testId, revisionId, reportId, jobId, testType, '0', startTime, testName, testDescription, testConfiguration, notes, lastUpdateAt);

            should(sequelizeFindOrCreateStub.args[0][0]).eql({
                'defaults': {
                    'job_id': jobId,
                    'last_updated_at': lastUpdateAt,
                    'notes': 'some notes',
                    'phase': '0',
                    'revision_id': revisionId,
                    'start_time': startTime,
                    'test_configuration': testConfiguration,
                    'test_description': 'desc',
                    'test_id': testId,
                    'test_name': 'unit-test',
                    'test_type': 'basic',
                    'runners_subscribed': []
                },
                'where': {
                    'report_id': reportId
                }
            });
        });
    });

    describe('Get reports', () => {
        it('should get multiple reports', async () => {
            let sequelizeResponse = [{
                dataValues: {
                    reportId,
                    testId,
                    jobId,
                    revisionId,
                    testType,
                    startTime,
                    testName,
                    testDescription,
                    testConfiguration,
                    notes,
                    subscribers
                }
            }, {
                dataValues: {
                    reportId,
                    testId,
                    jobId,
                    revisionId,
                    testType,
                    startTime,
                    testName,
                    testDescription,
                    testConfiguration,
                    subscribers
                }
            }];

            sequelizeGetStub.resolves(sequelizeResponse);
            let reports = await sequelizeConnector.getReports();

            should(reports.length).eql(2);
            should(reports[0]).eql({
                reportId,
                testId,
                jobId,
                revisionId,
                testType,
                startTime,
                testName,
                testDescription,
                testConfiguration,
                notes,
                subscribers: [
                    {
                        runner_id: '12345',
                        phase_status: 'done',
                        last_stats: {}
                    }
                ]
            });
            should(reports[1]).eql({
                reportId,
                testId,
                jobId,
                revisionId,
                testType,
                startTime,
                testName,
                testDescription,
                testConfiguration,
                subscribers: [
                    {
                        runner_id: '12345',
                        phase_status: 'done',
                        last_stats: {}

                    }
                ]
            });
        });

        it('should get multiple reports - no reports exists', async () => {
            let sequelizeResponse = [];

            sequelizeGetStub.resolves(sequelizeResponse);
            let reports = await sequelizeConnector.getReports();

            should(reports.length).eql(0);
        });
    });

    describe('Get single report', () => {
        it('should get single report', async () => {
            let sequelizeResponse = [{
                dataValues: {
                    reportId,
                    testId,
                    jobId,
                    revisionId,
                    testType,
                    startTime,
                    testName,
                    testDescription,
                    testConfiguration,
                    notes,
                    subscribers
                }
            }];

            sequelizeGetStub.resolves(sequelizeResponse);
            let reports = await sequelizeConnector.getReport(testId, reportId);

            should(reports).eql([{
                reportId,
                testId,
                jobId,
                revisionId,
                testType,
                startTime,
                testName,
                testDescription,
                testConfiguration,
                notes,
                subscribers: [
                    {
                        runner_id: '12345',
                        phase_status: 'done',
                        last_stats: {}
                    }
                ]
            }]);

            should(sequelizeGetStub.args[0][0]).containEql({
                'attributes': {
                    'exclude': [
                        'updated_at',
                        'created_at'
                    ]
                },
                'where': {
                    report_id: reportId,
                    test_id: testId
                }
            });
        });

        it('should return empty response as no such report id exists', async () => {
            let sequelizeResponse = [];

            sequelizeGetStub.resolves(sequelizeResponse);
            let reports = await sequelizeConnector.getReport(testId, reportId);

            should(reports).eql([]);
        });
    });

    describe('Update report', () => {
        it('should succeed updating report', async () => {
            const endTime = Date.now();
            const lastUpdatedAt = Date.now();

            await sequelizeConnector.updateReport(testId, reportId, '0', lastUpdatedAt, endTime);

            should(sequelizeUpdateStub.args[0][0]).eql({
                'last_updated_at': lastUpdatedAt,
                'phase': '0'
            });

            should(sequelizeUpdateStub.args[0][1]).eql({
                'where': {
                    test_id: testId,
                    report_id: reportId
                }
            });
        });
    });

    describe('Insert stats', () => {
        it('should succeed inserting stats', async () => {
            const runnerId = uuid();
            const statsTime = Date.now();
            const statId = uuid();
            const phaseIndex = 0;
            const phaseStatus = 'initiliazed';
            const data = JSON.stringify({message: 'started'});

            await sequelizeConnector.insertStats(runnerId, testId, reportId, statId, statsTime, phaseIndex, phaseStatus, data);

            should(sequelizeInsertStatsStub.args[0][0]).eql({
                'runner_id': runnerId,
                'data': data,
                'phase_index': 0,
                'phase_status': 'initiliazed',
                'report_id': reportId,
                'stats_id': statId,
                'stats_time': statsTime,
                'test_id': testId
            });
        });
    });

    describe('Get stats', () => {
        it('should succeed getting stats', async () => {
            const statsTime = Date.now();
            const statId = uuid();
            let sequelizeResponse = [{
                dataValues: {
                    stats_id: statId,
                    test_id: testId,
                    report_id: reportId,
                    runner_id: uuid(),
                    stats_time: statsTime,
                    phase_status: uuid(),
                    phase_index: uuid(),
                    data: JSON.stringify({median: 5})
                }
            }];

            sequelizeGetStub.resolves(sequelizeResponse);
            await sequelizeConnector.getStats(testId, reportId);
            should(sequelizeGetStub.args[0][0]).eql({
                'attributes': {
                    'exclude': [
                        'updated_at',
                        'created_at'
                    ]
                },
                'where': {
                    report_id: reportId,
                    test_id: testId
                }
            });
        });
    });

    describe('Subscribe runner', () => {
        it('Should successfully subscribe runner', async () => {
            let sequelizeResponse = [{
                dataValues: {
                    reportId,
                    testId,
                    jobId,
                    revisionId,
                    testType,
                    startTime,
                    testName,
                    testDescription,
                    testConfiguration,
                    notes
                },
                getSubscribers: sequelizeGetSubscribersStatsStub,
                createSubscriber: sequelizeCreateSubscriberStatsStub
            }];

            sequelizeGetStub.resolves(sequelizeResponse);
            await sequelizeConnector.subscribeRunner('test_id', 'report_id', 'runner_id');
        });
    });

    describe('Update subscribers', () => {
        it('Should successfully subscribe runner', async () => {
            sequelizeGetSubscribersStatsStub.resolves([{
                dataValues: {
                    runner_id: 'runner_id',
                    phase_status: 'initializing'
                },
                set: () => {
                },
                save: () => {
                }
            }]);


            let sequelizeResponse = [{
                dataValues: {
                    reportId,
                    testId,
                    jobId,
                    revisionId,
                    testType,
                    startTime,
                    testName,
                    testDescription,
                    testConfiguration,
                    notes
                },
                getSubscribers: sequelizeGetSubscribersStatsStub,
                createSubscriber: sequelizeCreateSubscriberStatsStub
            }];

            sequelizeGetStub.resolves(sequelizeResponse);
            await sequelizeConnector.updateSubscribers('test_id', 'report_id', 'runner_id', 'started_phase');
        });
    });
});