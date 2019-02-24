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
        sequelizeFindOrCreateStub = sandbox.stub();
        sequelizeUpdateStub = sandbox.stub();
        sequelizeGetStub = sandbox.stub();
        sequelizeDestroyStub = sandbox.stub();
        sequelizeModelStub = sandbox.stub();
        sequelizeCloseStub = sandbox.stub();
        sequelizeStub = sandbox.stub();
        sequelizeInsertStatsStub = sandbox.stub();

        sequelizeDefineStub.returns({
            sync: () => {
            }
        });

        sequelizeModelStub.returns({
            email: {},
            webhook: {},
            findOrCreate: sequelizeFindOrCreateStub,
            create: sequelizeInsertStatsStub,
            update: sequelizeUpdateStub,
            findAll: sequelizeGetStub,
            destroy: sequelizeDestroyStub
        });

        sequelizeStub.returns({
            authenticate: sequelizeAuthenticateStub,
            model: sequelizeModelStub,
            define: sequelizeDefineStub,
            close: sequelizeCloseStub
        });
        sequelizeStub.DataTypes = {
            TEXT: () => {}
        };
        sequelizeConnector.__set__('Sequelize', sequelizeStub);

        reportId = uuid.v4();
        testId = uuid.v4();
        jobId = uuid.v4();
        revisionId = uuid.v4();
        testType = 'custom';
        startTime = Date.now();
        testName = 'unit-test';
        testDescription = 'desc';
        testConfiguration = JSON.stringify({ environment: 'test' });
        notes = 'some notes';
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
            await sequelizeConnector.init(sequelizeStub());

            await sequelizeConnector.insertReport(testId, revisionId, reportId, jobId, testType, startTime, testName, testDescription, testConfiguration, notes);

            should(sequelizeFindOrCreateStub.args[0][0]).eql({
                'defaults': {
                    'job_id': jobId,
                    'end_time': null,
                    'last_stats': null,
                    'notes': 'some notes',
                    'phase': '0',
                    'report_type': 'basic',
                    'revision_id': revisionId,
                    'start_time': startTime,
                    'status': 'initialized',
                    'test_configuration': testConfiguration,
                    'test_description': 'desc',
                    'test_id': testId,
                    'test_name': 'unit-test',
                    'test_type': 'custom',
                },
                'where': {
                    'report_id': reportId
                }
            });
        });
    });

    describe('Get reports', () => {
        it('should get multiple reports', async () => {
            await sequelizeConnector.init(sequelizeStub());

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
                notes
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
                testConfiguration
            });
        });

        it('should get multiple reports - no reports exists', async () => {
            await sequelizeConnector.init(sequelizeStub());

            let sequelizeResponse = [];

            sequelizeGetStub.resolves(sequelizeResponse);
            let reports = await sequelizeConnector.getReports();

            should(reports.length).eql(0);
        });
    });

    describe('Get single report', async () => {
        it('should get single report', async () => {
            await sequelizeConnector.init(sequelizeStub());

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
                    notes                }
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
                notes
            }]);

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

        it('should return empty response as no such report id exists', async () => {
            await sequelizeConnector.init(sequelizeStub());

            let sequelizeResponse = [];

            sequelizeGetStub.resolves(sequelizeResponse);
            let reports = await sequelizeConnector.getReport(testId, reportId);

            should(reports).eql([]);
        });
    });

    describe('Update report', () => {
        it('should succeed updating report', async () => {
            await sequelizeConnector.init(sequelizeStub());
            const endTime = Date.now();

            await sequelizeConnector.updateReport(testId, reportId, 'intermediate', 0, { median: 1 }, endTime);

            should(sequelizeUpdateStub.args[0][0]).eql({
                'end_time': endTime,
                'last_stats': {
                    'median': 1
                },
                'phase': 0,
                'status': 'intermediate'
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
            await sequelizeConnector.init(sequelizeStub());
            const containerId = uuid();
            const statsTime = Date.now();
            const statId = uuid();
            const phaseIndex = 0;
            const phaseStatus = 'initiliazed';
            const data = JSON.stringify({message: 'started'});

            await sequelizeConnector.insertStats(containerId, testId, reportId, statId, statsTime, phaseIndex, phaseStatus, data);

            should(sequelizeInsertStatsStub.args[0][0]).eql({
                'container_id': containerId,
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
            await sequelizeConnector.init(sequelizeStub());
            const statsTime = Date.now();
            const statId = uuid();


            let sequelizeResponse = [{
                dataValues: {
                    stats_id: statId,
                    test_id: testId,
                    report_id: reportId,
                    container_id: uuid(),
                    stats_time: statsTime,
                    phase_status: uuid(),
                    phase_index: uuid(),
                    data: JSON.stringify({ median: 5 })
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
});