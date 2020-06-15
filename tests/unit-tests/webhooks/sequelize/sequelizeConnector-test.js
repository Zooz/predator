'use strict';
const sinon = require('sinon'),
    { expect } = require('chai'),
    databaseConfig = require('../../../../src/config/databaseConfig'),
    sequelizeConnector = require('../../../../src/webhooks/models/database/sequelize/sequelizeConnector');

describe('Sequelize client tests', function () {
    const webhookRaw = {
        id: '3e10d10e-2ae0-418e-aa91-0fd659dd86fb',
        name: 'my special webhook',
        url: 'http://callback.com',
        global: false,
        format_type: 'json',
        created_at: '2020-06-13T13:13:16.763Z',
        updated_at: '2020-06-13T13:13:16.763Z',
        events: []
    };

    let sandbox,
        sequelizeModelStub,
        sequelizeDeleteStub,
        sequelizeDefineStub,
        sequelizeGeValueStub,
        sequelizeGetStub,
        sequelizeCreateStub,
        sequelizeUpdateStub,
        sequelizeBelongsToMany;

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
        sequelizeBelongsToMany = sandbox.stub();

        sequelizeDefineStub.returns({
            hasMany: () => {
            },
            sync: () => {
            },
            belongsToMany: () => {

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

    describe('getAllWebhooks', function() {
        describe('Happy flow', function() {
            it('expect return an array with 1 webhook', async function() {
                sequelizeGetStub.resolves([webhookRaw]);
                const webhooks = await sequelizeConnector.getAllWebhooks();

                expect(sequelizeGetStub.calledOnce).to.be.equal(true);
                expect(sequelizeGetStub.args[0][0]).to.be.deep.equal({ include: ['events'] });

                expect(webhooks).to.be.an('array').and.have.lengthOf(1);
                expect(webhooks[0]).to.be.deep.equal(webhookRaw);
            });
        });
    });
});
