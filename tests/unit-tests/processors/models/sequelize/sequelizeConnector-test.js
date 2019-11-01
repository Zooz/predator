'use strict';
const sinon = require('sinon'),
    should = require('should'),
    databaseConfig = require('../../../../../src/config/databaseConfig'),
    sequelizeConnector = require('../../../../../src/processors/models/database/sequelize/sequelizeConnector');

describe('Sequelize client tests', function () {
    let sandbox,
        sequelizeModelStub,
        sequelizeUpsertStub,
        sequelizeDeleteStub,
        sequelizeDefineStub,
        sequelizeGeValueetStub,
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
        sequelizeUpsertStub = sandbox.stub();
        sequelizeDefineStub = sandbox.stub();
        sequelizeGetStub = sandbox.stub();
        sequelizeDeleteStub = sandbox.stub();
        sequelizeGeValueetStub = sandbox.stub();
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
            findOne: sequelizeGeValueetStub,
            destroy: sequelizeDeleteStub,
            upsert: sequelizeUpsertStub,
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

    describe('Get Processors Files', () => {
        it('Validate sequelize passed arguments', async () => {
            const limit = 25;
            const offset = 10;
            await sequelizeConnector.getAllProcessors(offset, limit);
            should(sequelizeGetStub.calledOnce).eql(true);
            should(sequelizeGetStub.args[0][0]).containDeep({ offset, limit });
        });
    });

    describe('Insert a processor', () => {
        it('Happy flow', async () => {
            const processor = {
                processor_id: '6063ae04-f832-11e9-aad5-362b9e155667',
                name: 'processor name',
                description: 'bla bla bla',
                type: 'raw_javascript',
                javascript: 'module.exports = 5;'
            };
            await sequelizeConnector.insertProcessor(processor.processor_id, processor);
            const paramsArg = sequelizeCreateStub.args[0][0];
            should(sequelizeCreateStub.calledOnce).eql(true);
            should(paramsArg).containDeep(processor);
            should(paramsArg).has.properties(['created_at', 'updated_at']);
        });
    });
});
