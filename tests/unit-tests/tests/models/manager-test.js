'use strict';
let should = require('should');
let manager = require('../../../../src/tests/models/manager');
let sinon = require('sinon');
let database = require('../../../../src/tests/models/database');
let testGenerator = require('../../../../src/tests/models/testGenerator');
let uuid = require('uuid');

describe('Scenario generator tests', function () {
    let sandbox;
    let insertStub;
    let deleteStub;
    let getTestStub;
    let getTestsStub;
    let testGeneratorStub;
    let getTestRevisionsStub;

    before(() => {
        sandbox = sinon.sandbox.create();
        insertStub = sandbox.stub(database, 'insertTest');
        getTestStub = sandbox.stub(database, 'getTest');
        getTestsStub = sandbox.stub(database, 'getTests');
        getTestRevisionsStub = sandbox.stub(database, 'getAllTestRevisions');
        deleteStub = sandbox.stub(database, 'deleteTest');
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

            return manager.upsertTest({
                testInfo: 'info'})
                .then(function (result) {
                    insertStub.calledOnce.should.eql(true);
                    result.should.have.keys('id', 'revision_id');
                    Object.keys(result).length.should.eql(2);
                });
        });
    });

    describe('Update existing test', function () {
        it('Should update test, keep the existing test id and generate new revision id', function () {
            testGeneratorStub.resolves({
                testjson: 'json'
            });
            insertStub.resolves();

            let existingTestId = uuid();
            return manager.upsertTest({
                testInfo: 'info'}, existingTestId)
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

            let existingTestId = uuid();
            return manager.deleteTest(existingTestId)
                .then(function () {
                    deleteStub.calledOnce.should.eql(true);
                });
        });
    });

    describe('Get single test', function () {
        it('Database returns undefined, should return undefined', function () {
            getTestStub.resolves();
            return manager.getTest(uuid.v4())
                .then(function (res) {
                    should.not.exist(res);
                });
        });

        it('Database returns one row, should return the test', function () {
            getTestStub.resolves({
                artillery_json: {id: '1', name: '1'},
                raw_data: {id: '1', name: '1'}
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
            let firstId = uuid.v4();
            let secondId = uuid.v4();
            let expectedResult = [{
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
            let firstId = uuid.v4();
            let secondId = uuid.v4();
            let expectedResult = [{
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
        it('Database returns empty row array, should return undefined', function () {
            getTestRevisionsStub.resolves([]);
            return manager.getAllTestRevision(uuid.v4())
                .then(function (res) {
                    should.not.exist(res);
                });
        });

        it('Database returns one row, should return the test', function () {
            let expectedResult = [{
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
            return manager.getAllTestRevision(uuid.v4())
                .then(function (res) {
                    res.should.eql(expectedResult);
                });
        });
    });
});