'use strict';
let should = require('should');
let sinon = require('sinon');
let uuid = require('uuid');
let rewire = require('rewire');

let database = require('../../../../src/processors/models/database/databaseConnector');
let manager = rewire('../../../../src/processors/models/processorsManager');

describe('Processor manager tests', function () {
    let sandbox;
    let insertStub;
    let deleteStub;
    let getProcessorByIdStub;
    let getProcessorByNameStub;
    let getProcessorsStub;
    let updatedProcessorStub;
    let testsManagerStub;
    let originalTestManager;

    before(() => {
        sandbox = sinon.sandbox.create();
        insertStub = sandbox.stub(database, 'insertProcessor');
        getProcessorByIdStub = sandbox.stub(database, 'getProcessorById');
        getProcessorByNameStub = sandbox.stub(database, 'getProcessorByName');
        getProcessorsStub = sandbox.stub(database, 'getAllProcessors');
        deleteStub = sandbox.stub(database, 'deleteProcessor');
        updatedProcessorStub = sandbox.stub(database, 'updateProcessor');
        testsManagerStub = {
            getTestsByProcessorId: sandbox.stub()
        };
        originalTestManager = manager.__get__('testsManager');
        manager.__set__('testsManager', testsManagerStub);
    });

    beforeEach(() => {
        sandbox.resetHistory();
        sandbox.reset();
    });

    after(() => {
        sandbox.restore();
        manager.__set__('testsManager', originalTestManager);
    });
    describe('Create new processor', function () {
        it('Should save new test to database and return the processor id', async function () {
            const firstProcessor = {
                description: 'first processor',
                name: 'mickey',
                javascript: "module.exports.mickey = 'king'"
            };
            getProcessorByNameStub.resolves(null);
            const processor = await manager.createProcessor(firstProcessor);
            should(processor.id).not.be.empty();
            should(processor).containDeep(firstProcessor);
        });

        it('Should return error for invalid javascript', async function () {
            let exception;
            const firstProcessor = {
                description: 'bad processor',
                name: 'mickey',
                javascript: 'this is not js'
            };
            try {
                await manager.createProcessor(firstProcessor);
            } catch (e) {
                exception = e;
            }
            should(exception.statusCode).eql(422);
            should(exception.message).eql('javascript syntax validation failed with error: Unexpected identifier');
        });

        it('should throw an error of name already exists', async function() {
            const processor = {
                description: 'first processor',
                name: 'mickey',
                javascript: "module.exports.mickey = 'king'"
            };
            getProcessorByNameStub.resolves(processor);
            try {
                await manager.createProcessor(processor);
                throw new Error('should not get here');
            } catch (e) {
                should(e.statusCode).equal(400);
            }
        });
    });
    describe('Delete existing processor', function () {
        it('Should delete processor', async function () {
            testsManagerStub.getTestsByProcessorId.resolves([]);
            deleteStub.resolves();
            const existingProcessorId = uuid();
            await manager.deleteProcessor(existingProcessorId);
            deleteStub.calledOnce.should.eql(true);
        });
        it('Should throw an error for a processor that is used by a test', async function() {
            testsManagerStub.getTestsByProcessorId.resolves([{ name: 'predator' }]);
            deleteStub.resolves();
            try {
                await manager.deleteProcessor(uuid());
                throw Error('Should have thrown an error');
            } catch (e) {
                should(e.statusCode).equal(409);
            }
        });
    });
    describe('Get single processor', function () {
        it('Database returns one row, should return the processor', async function () {
            const firstProcessor = {
                id: uuid(),
                description: 'first processor',
                name: 'mickey1'
            };

            getProcessorByIdStub.resolves(firstProcessor);

            const processors = await manager.getProcessor(firstProcessor.id);
            processors.should.eql(firstProcessor);
        });
        it('Database returns undefined, should throw 404', async function () {
            let exception;
            getProcessorByIdStub.resolves();
            try {
                await manager.getProcessor(uuid());
            } catch (e) {
                exception = e;
            }
            should(exception.statusCode).eql(404);
            should(exception.message).eql('Not found');
        });
    });
    describe('Get multiple processors', function () {
        it('Database returns empty row array, should return empty array', async function () {
            getProcessorsStub.resolves([]);
            const processors = await manager.getAllProcessors();
            processors.should.eql([]);
        });

        it('Database returns two rows array, should return two processors', async function () {
            const firstProcessor = {
                id: uuid(),
                description: 'first processor',
                name: 'mickey1'
            };

            const secondProcessor = {
                id: uuid(),
                description: 'first processor',
                name: 'mickey1'
            };

            getProcessorsStub.resolves([
                firstProcessor,
                secondProcessor
            ]);

            const processors = await manager.getAllProcessors();
            processors.should.eql([
                firstProcessor,
                secondProcessor
            ]);
        });
    });
    describe('Update processor', function () {
        const oldProcessor = {
            id: uuid(),
            description: 'old processor',
            name: 'old',
            javascript: 'module.exports.old = true'
        };
        it('Should update processor successfully', async function () {
            const updatedProcessor = {
                description: 'update processor',
                name: 'mickey2',
                javascript: 'module.exports.update = true'
            };
            getProcessorByIdStub.resolves(oldProcessor);
            updatedProcessorStub.resolves();

            const processor = await manager.updateProcessor(oldProcessor.id, updatedProcessor);
            should(processor).containDeep(updatedProcessor);
        });
        it('Should fail to update processor - processor does not exist', async function () {
            let exception;
            const updatedProcessor = {
                description: 'update processor',
                name: 'mickey2',
                javascript: 'invalid js'
            };
            getProcessorByIdStub.resolves();
            try {
                await manager.updateProcessor(oldProcessor.id, updatedProcessor);
            } catch (e) {
                exception = e;
            }
            should(exception.statusCode).eql(404);
            should(exception.message).eql('Not found');
        });
        it('Should fail to update processor - invalid js', async function () {
            let exception;
            const updatedProcessor = {
                description: 'update processor',
                name: 'mickey2',
                javascript: 'invalid js'
            };
            getProcessorByIdStub.resolves(oldProcessor);
            updatedProcessorStub.resolves();
            try {
                await manager.updateProcessor(oldProcessor.id, updatedProcessor);
            } catch (e) {
                exception = e;
            }
            should(exception.statusCode).eql(422);
            should(exception.message).eql('javascript syntax validation failed with error: Unexpected identifier');
        });

        it('should fail - updating a processor name to another existing processor name', async function() {
            const updatedProcessor = {
                description: 'update processor',
                name: 'mickey2',
                javascript: 'module.exports.update = true'
            };
            getProcessorByIdStub.resolves(oldProcessor);
            getProcessorByNameStub.resolves(updatedProcessor);
            try {
                await manager.updateProcessor(oldProcessor.id, updatedProcessor);
                throw new Error('should not get here');
            } catch (err) {
                should(err.statusCode).equal(400);
            }
        });
    });
});
