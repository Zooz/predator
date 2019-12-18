'use strict';
let should = require('should');
let manager = require('../../../../src/processors/models/processorsManager');
let sinon = require('sinon');
let database = require('../../../../src/processors/models/database/databaseConnector');
let uuid = require('uuid');

describe('Processor manager tests', function () {
    let sandbox;
    let insertStub;
    let deleteStub;
    let getProcessorStub;
    let getProcessorsStub;
    let updatedProcessorStub;

    before(() => {
        sandbox = sinon.sandbox.create();
        insertStub = sandbox.stub(database, 'insertProcessor');
        getProcessorStub = sandbox.stub(database, 'getProcessor');
        getProcessorsStub = sandbox.stub(database, 'getAllProcessors');
        deleteStub = sandbox.stub(database, 'deleteProcessor');
        updatedProcessorStub = sandbox.stub(database, 'updateProcessor');
    });

    beforeEach(() => {
        sandbox.resetHistory();
    });

    after(() => {
        sandbox.restore();
    });
    describe('Create new processor', function () {
        it('Should save new test to database and return the processor id', async function () {
            const firstProcessor = {
                description: 'first processor',
                name: 'mickey',
                javascript: `module.exports.mickey = 'king'`
            };

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
    });
    describe('Delete existing processor', function () {
        it('Should delete processor', async function () {
            deleteStub.resolves();
            const existingProcessorId = uuid();
            await manager.deleteProcessor(existingProcessorId);
            deleteStub.calledOnce.should.eql(true);
        });
    });
    describe('Get single processor', function () {
        it('Database returns one row, should return the processor', async function () {
            const firstProcessor = {
                id: uuid(),
                description: 'first processor',
                name: 'mickey1'
            };

            getProcessorStub.resolves(firstProcessor);

            const processors = await manager.getProcessor(firstProcessor.id);
            processors.should.eql(firstProcessor);
        });
        it('Database returns undefined, should throw 404', async function () {
            let exception;
            getProcessorStub.resolves();
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
            getProcessorStub.resolves(oldProcessor);
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
            getProcessorStub.resolves();
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
            getProcessorStub.resolves(oldProcessor);
            updatedProcessorStub.resolves();
            try {
                await manager.updateProcessor(oldProcessor.id, updatedProcessor);
            } catch (e) {
                exception = e;
            }
            should(exception.statusCode).eql(422);
            should(exception.message).eql('javascript syntax validation failed with error: Unexpected identifier');
        });
    });
});