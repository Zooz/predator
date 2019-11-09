'use strict';
const sinon = require('sinon'),
    should = require('should'),
    uuid = require('uuid/v4'),
    databaseConfig = require('../../../../../src/config/databaseConfig'),
    sequelizeConnector = require('../../../../../src/processors/models/database/sequelize/sequelizeConnector');

describe('Sequelize client tests', function () {
    const processor = {
        id: '6063ae04-f832-11e9-aad5-362b9e155667',
        name: 'processor name',
        description: 'bla bla bla',
        type: 'raw_javascript',
        javascript: 'module.exports = 5;'
    };

    let sandbox,
        sequelizeModelStub,
        sequelizeDeleteStub,
        sequelizeDefineStub,
        sequelizeGeValueStub,
        sequelizeGetStub,
        sequelizeCreateStub;

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
        it('Validate sequelize passed arguments', async () => {
            sequelizeGetStub.returns([processor]);

            const processorId = processor.id;
            await sequelizeConnector.getProcessor(processorId);
            should(sequelizeGetStub.calledOnce).eql(true);
            should(sequelizeGetStub.args[0][0]).containDeep({ where: { id: processorId }});
        });
    });

    describe('Insert a processor', () => {
        it('Happy flow', async () => {
            await sequelizeConnector.insertProcessor(processor.id, processor);
            const paramsArg = sequelizeCreateStub.args[0][0];
            should(sequelizeCreateStub.calledOnce).eql(true);
            should(paramsArg).containDeep(processor);
            should(paramsArg).has.properties(['created_at', 'updated_at']);
        });
    });
});
