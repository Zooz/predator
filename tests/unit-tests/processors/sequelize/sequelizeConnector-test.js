'use strict';
const sinon = require('sinon'),
    should = require('should'),
    databaseConfig = require('../../../../src/config/databaseConfig'),
    sequelizeConnector = require('../../../../src/processors/models/database/sequelize/sequelizeConnector');

describe('Sequelize client tests', function () {
    const processorRaw = {
        id: '6063ae04-f832-11e9-aad5-362b9e155667',
        name: 'processor name',
        description: 'bla bla bla',
        javascript: 'module.exports = 5;'
    };
    const processor = {
        get: () => {
            return {
                processorRaw
            };
        }
    };

    Object.assign(processor, processorRaw);

    let sandbox,
        sequelizeModelStub,
        sequelizeDeleteStub,
        sequelizeDefineStub,
        sequelizeGeValueStub,
        sequelizeGetStub,
        sequelizeCreateStub,
        sequelizeUpdateStub;

    before(async () => {
        sandbox = sinon.sandbox.create();
    });

    beforeEach(async () => {
        databaseConfig.type = 'SQLITE';
        databaseConfig.name = 'predator';
        databaseConfig.username = 'username';
        databaseConfig.password = 'password';

        sequelizeModelStub = sandbox.stub();
        sequelizeDefineStub = sandbox.stub();
        sequelizeGetStub = sandbox.stub();
        sequelizeDeleteStub = sandbox.stub();
        sequelizeGeValueStub = sandbox.stub();
        sequelizeCreateStub = sandbox.stub();
        sequelizeUpdateStub = sandbox.stub();

        sequelizeDefineStub.returns({
            hasMany: () => {
            },
            sync: () => {
            }
        });

        sequelizeModelStub.returns({
            key: {},
            value: {},
            findAll: sequelizeGetStub,
            findOne: sequelizeGeValueStub,
            destroy: sequelizeDeleteStub,
            create: sequelizeCreateStub
        });

        await sequelizeConnector.init({
            model: sequelizeModelStub,
            define: sequelizeDefineStub
        });
    });

    afterEach(() => {
        sandbox.resetHistory();
    });

    after(() => {
        sandbox.restore();
    });

    describe('Get Processors', () => {
        it('Validate sequelize passed arguments', async () => {
            const limit = 25;
            const offset = 10;
            await sequelizeConnector.getAllProcessors(offset, limit);
            should(sequelizeGetStub.calledOnce).eql(true);
            should(sequelizeGetStub.args[0][0]).containDeep({ offset, limit });
        });
    });

    describe('Get specific Processors', () => {
        describe('getProcessorById', function() {
            it('Validate sequelize passed arguments', async () => {
                sequelizeGetStub.returns([processor]);
                const processorId = processor.id;
                await sequelizeConnector.getProcessorById(processorId);
                should(sequelizeGetStub.calledOnce).eql(true);
                should(sequelizeGetStub.args[0][0]).containDeep({ where: { id: processorId } });
            });
        });
        describe('getProcessorByName', function() {
            it('Validate sequelize passed arguments', async () => {
                sequelizeGetStub.returns([processor]);
                const processorName = processor.name;
                await sequelizeConnector.getProcessorByName(processorName);
                should(sequelizeGetStub.calledOnce).eql(true);
                should(sequelizeGetStub.args[0][0]).containDeep({ where: { name: processorName } });
            });
        });
    });

    describe('Insert a processor', () => {
        it('Happy flow', async () => {
            await sequelizeConnector.insertProcessor(processor.id, processor);
            const paramsArg = sequelizeCreateStub.args[0][0];
            should(sequelizeCreateStub.calledOnce).eql(true);
            should(paramsArg).containDeep(processorRaw);
            should(paramsArg).has.properties(['created_at', 'updated_at']);
        });
    });

    describe('Delete processor', () => {
        it('validate query', async () => {
            const processorId = 'A-B-C';
            await sequelizeConnector.deleteProcessor(processorId);
            should(sequelizeDeleteStub.args[0][0]).deepEqual({ where: { id: processorId } });
        });
    });

    describe('Updating processor', () => {
        it('updating javascript content', async () => {
            const processorId = 'A-C-B';
            const updatedProcessor = {
                name: 'name',
                type: 'file_download',
                description: 'bla-bla',
                file_url: 'https://fakeurl.com',
                javascript: 'module.exports=9;',
                updated_at: Date.now(),
                created_at: Date.now()
            };
            sequelizeModelStub.returns({ update: sequelizeUpdateStub });
            await sequelizeConnector.updateProcessor(processorId, updatedProcessor);
            should(sequelizeUpdateStub.calledOnce).equal(true);
            should(sequelizeUpdateStub.args[0][0].updated_at).greaterThanOrEqual(updatedProcessor.updated_at);
            should(sequelizeUpdateStub.args[0][0].javascript).equal(updatedProcessor.javascript);
            should(sequelizeUpdateStub.args[0][1].where.id).equal(processorId);
        });
    });
});
