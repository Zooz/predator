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
        sequelizeGetStub;

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
            upsert: sequelizeUpsertStub
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
        it('Validate sequelize passed arguements', async () => {
            const limit = 25;
            const offset = 10;
            await sequelizeConnector.getAllProcessors(offset, limit);
            should(sequelizeGetStub.calledOnce).eql(true);
            should(sequelizeGetStub.args[0][0]).eql({ offset, limit });
        });
    });
});
