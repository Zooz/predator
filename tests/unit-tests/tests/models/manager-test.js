'use strict';
const should = require('should');
const manager = require('../../../../src/tests/models/manager');
const fileManager = require('../../../../src/files/models/fileManager');

const sinon = require('sinon');
const database = require('../../../../src/tests/models/database');
const testGenerator = require('../../../../src/tests/models/testGenerator');
const request = require('request-promise-native');
const uuid = require('uuid');

describe('Scenario generator tests', function () {
    let sandbox;
    let insertStub;
    let deleteStub;
    let getTestStub;
    let getTestsStub;
    let testGeneratorStub;
    let getTestRevisionsStub;
    let saveFileStub;
    let getRequestStub;
    let insertBenchmarkStub;
    let getTestBenchmarkStub;

    before(() => {
        sandbox = sinon.sandbox.create();
        insertStub = sandbox.stub(database, 'insertTest');
        insertBenchmarkStub = sandbox.stub(database, 'insertTestBenchmark');
        getTestBenchmarkStub = sandbox.stub(database, 'getTestBenchmark');
        getTestStub = sandbox.stub(database, 'getTest');
        getTestsStub = sandbox.stub(database, 'getTests');
        getTestRevisionsStub = sandbox.stub(database, 'getAllTestRevisions');
        deleteStub = sandbox.stub(database, 'deleteTest');
        getRequestStub = sandbox.stub(request, 'get');
        saveFileStub = sandbox.stub(fileManager, 'saveFile');
        testGeneratorStub = sandbox.stub(testGenerator, 'createTest');
    });

    beforeEach(() => {
        sandbox.resetHistory();
    });

    after(() => {
        sandbox.restore();
    });
    describe('Create new test', function () {
        it('Should save new test to database and return the test id and revision', function () {
            testGeneratorStub.resolves({
                testjson: 'json'
            });
            insertStub.resolves();

            return manager.upsertTest({ testInfo: 'info' })
                .then(function (result) {
                    insertStub.calledOnce.should.eql(true);
                    result.should.have.keys('id', 'revision_id');
                    Object.keys(result).length.should.eql(2);
                });
        });
    });
    describe('Create new benchmark for test', async () => {
        it('Should save new benchmark for test', async () => {
            insertBenchmarkStub.resolves();
            const result = await manager.insertTestBenchmark({ rps: 'some benchmark data' }, 1234);
            insertBenchmarkStub.calledOnce.should.eql(true);
            result.should.have.keys('benchmark_data');
            Object.keys(result).length.should.eql(1);
            should(result).eql({
                benchmark_data: { rps: 'some benchmark data' }
            });
        });
        it('Should get benchmark for test with no benchmark and get empty data', async () => {
            getTestBenchmarkStub.resolves();
            try {
                await manager.getBenchmark(1234);
                should.fail('Expected to throw error');
            } catch (err) {
                getTestBenchmarkStub.calledOnce.should.eql(true);
                should(err.statusCode).eql(404);
            }
        });
        it('Should get benchmark for test with  bench', async () => {
            getTestBenchmarkStub.resolves(JSON.stringify({ benchmark: 'some data' }));
            const result = await manager.getBenchmark(1234);
            getTestBenchmarkStub.calledOnce.should.eql(true);
            should(result).eql({ benchmark: 'some data' });
        });
    });
    describe('Create new file for test', function () {
        it('Should save new file to database', async () => {
            testGeneratorStub.resolves({
                testjson: 'json'
            });
            insertStub.resolves();
            getRequestStub.resolves('this is js code from dropbox');
            saveFileStub.resolves('id');

            const result = await manager.upsertTest({
                testInfo: 'info', processor_file_url: 'path to dropbox'
            });

            insertStub.calledOnce.should.eql(true);
            saveFileStub.calledOnce.should.eql(true);
            should.notEqual(insertStub.getCall(0).args[4], undefined);
            should(getRequestStub.getCall(0).args[0].url).eql('path to dropbox');
            result.should.have.keys('id', 'revision_id');
            Object.keys(result).length.should.eql(2);
        });
        it('Should fail to download file throw error', async () => {
            testGeneratorStub.resolves({
                testjson: 'json'
            });
            insertStub.resolves();
            getRequestStub.throws();
            saveFileStub.resolves();
            try {
                const result = await manager.upsertTest({
                    testInfo: 'info', processor_file_url: 'path to dropbox'
                });
                console.log(result);
                should.fail('Expected error to throw');
            } catch (err) {
                should(err.statusCode).eql(422);
            }
        });
    });

    describe('Update existing test', function () {
        it('Should update test, keep the existing test id and generate new revision id', function () {
            testGeneratorStub.resolves({
                testjson: 'json'
            });
            insertStub.resolves();

            const existingTestId = uuid();
            return manager.upsertTest({ testInfo: 'info' }, existingTestId)
                .then(function (result) {
                    insertStub.calledOnce.should.eql(true);
                    result.should.have.keys('id', 'revision_id');
                    result.id.should.eql(existingTestId);
                    Object.keys(result).length.should.eql(2);
                });
        });
    });

    describe('Delete existing test', function () {
        it('Should delete test', function () {
            deleteStub.resolves();

            const existingTestId = uuid();
            return manager.deleteTest(existingTestId)
                .then(function () {
                    deleteStub.calledOnce.should.eql(true);
                });
        });
    });

    describe('Get single test', function () {
        it('Database returns one row, should return the test', function () {
            getTestStub.resolves({
                artillery_json: { id: '1', name: '1' },
                raw_data: { id: '1', name: '1' }
            });
            return manager.getTest(uuid.v4())
                .then(function (res) {
                    res.should.eql({
                        raw_data: {
                            id: '1',
                            name: '1'
                        },
                        artillery_test: {
                            id: '1',
                            name: '1'
                        }
                    });
                });
        });
    });

    describe('Get multiple tests', function () {
        it('Database returns empty row array, should return empty array', function () {
            getTestsStub.resolves([]);
            return manager.getTests()
                .then(function (res) {
                    res.should.eql([]);
                });
        });

        it('Database returns two rows array, should return two tests', function () {
            const firstId = uuid.v4();
            const secondId = uuid.v4();
            const expectedResult = [{
                artillery_test: {
                    id: 1,
                    name: 1
                },
                raw_data: {
                    id: 1,
                    name: 1
                },
                id: firstId
            },
            {
                artillery_test: {
                    id: 1,
                    name: 1
                },
                raw_data: {
                    id: 1,
                    name: 1
                },
                id: secondId
            }
            ];
            getTestsStub.resolves([{
                id: firstId,
                raw_data: expectedResult[0].raw_data,
                artillery_json: expectedResult[0].artillery_test
            },
            {
                id: firstId,
                raw_data: expectedResult[0].raw_data,
                artillery_json: expectedResult[0].artillery_test
            },
            {
                id: secondId,
                raw_data: expectedResult[1].raw_data,
                artillery_json: expectedResult[1].artillery_test
            }
            ]);
            return manager.getTests()
                .then(function (res) {
                    res.should.containDeep(expectedResult);
                });
        });

        it('Database returns three rows array, two with the same id, should return two tests', function () {
            const firstId = uuid.v4();
            const secondId = uuid.v4();
            const expectedResult = [{
                artillery_test: {
                    id: 1,
                    name: 1
                },
                raw_data: {
                    id: 1,
                    name: 1
                },
                id: firstId
            },
            {
                artillery_test: {
                    id: 1,
                    name: 1
                },
                raw_data: {
                    id: 1,
                    name: 1
                },
                id: secondId
            }
            ];
            getTestsStub.resolves([{
                id: firstId,
                raw_data: expectedResult[0].raw_data,
                artillery_json: expectedResult[0].artillery_test
            },
            {
                id: secondId,
                raw_data: expectedResult[1].raw_data,
                artillery_json: expectedResult[1].artillery_test
            }
            ]);
            return manager.getTests()
                .then(function (res) {
                    res.should.containDeep(expectedResult);
                });
        });
    });

    describe('Get all test revisions', function () {
        it('Database returns empty row array, throw an error with 404', function () {
            getTestRevisionsStub.resolves([]);
            return manager.getAllTestRevisions(uuid.v4())
                .then(function (res) {
                    throw new Error('should not get here');
                }).catch(function (err) {
                    should(err.statusCode).eql(404);
                    should(err.message).eql('Not found');
                });
        });

        it('Database returns one row, should return the test', function () {
            const expectedResult = [{
                artillery_test: {
                    id: 1,
                    name: 1
                },
                raw_data: {
                    id: 1,
                    name: 1
                },
                id: uuid.v4(),
                revision_id: 'revision_id',
                updated_at: Date.now()
            }];
            getTestRevisionsStub.resolves([{
                artillery_json: expectedResult[0].artillery_test,
                raw_data: expectedResult[0].raw_data,
                id: expectedResult[0].id,
                revision_id: expectedResult[0].revision_id,
                updated_at: expectedResult[0].updated_at
            }]);
            return manager.getAllTestRevisions(uuid.v4())
                .then(function (res) {
                    res.should.eql(expectedResult);
                });
        });
    });

    describe('getTestsByProcessorId', function() {
        it('should return the rows from the database', async function() {
            const processorId = uuid();
            const rows = [{ name: 'firewall', processor_id: processorId }, { name: 'Generic', id: uuid() }];
            getTestsStub.resolves(rows);
            const result = await manager.getTestsByProcessorId(processorId);

            should(result.length).eql(1);
            should(result[0].name).eql('firewall');
        });
    });
});
