'use strict';
const sinon = require('sinon'),
    { expect } = require('chai'),
    databaseConfig = require('../../../../src/config/databaseConfig'),
    sequelizeConnector = require('../../../../src/webhooks/models/database/sequelize/sequelizeConnector');

const { WEBHOOK_EVENT_TYPES, WEBHOOK_EVENT_TYPE_STARTED } = require('../../../../src/common/consts');
const uuid = require('uuid');

describe('Sequelize client tests', function () {
    const webhookRaw = {
        dataValues: {
            id: '3e10d10e-2ae0-418e-aa91-0fd659dd86fb',
            name: 'my special webhook',
            url: 'http://callback.com',
            global: false,
            format_type: 'json',
            created_at: '2020-06-13T13:13:16.763Z',
            updated_at: '2020-06-13T13:13:16.763Z',
        },
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
        sequelizeBelongsToMany,
        sequelizeTransactionStub;

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
        sequelizeTransactionStub = sandbox.stub();

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
            update: sequelizeUpdateStub,
            findAll: sequelizeGetStub,
            findOne: sequelizeGeValueStub,
            destroy: sequelizeDeleteStub,
            create: sequelizeCreateStub,
            findByPk: sequelizeGetStub
        });

        await sequelizeConnector.init({
            model: sequelizeModelStub,
            define: sequelizeDefineStub,
            transaction: sequelizeTransactionStub
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
                expect(webhooks[0]).to.be.deep.contain(webhookRaw.dataValues);
                expect(webhooks[0].events).to.be.deep.equal(webhookRaw.events);
            });
        });
    });

    describe('createWebhook', function() {
        describe('Happy flow', function() {
            it('expect to return a webhook with a valid uuid', async function() {
                const events = [WEBHOOK_EVENT_TYPES[0], WEBHOOK_EVENT_TYPES[1]];
                const eventRecords = events.map(event => ({dataValues: {id: uuid(), name: event}}));
                const webhook = {
                    ...webhookRaw.dataValues,
                    events
                };
                const webhookWithEvents = {
                    dataValues: {
                        ...webhookRaw.dataValues
                    },
                    events: eventRecords
                };
                sequelizeGetStub.onFirstCall().resolves(eventRecords);
                sequelizeGetStub.onSecondCall().resolves(webhookWithEvents);
                sequelizeTransactionStub.resolves();
                const createdWebhook = await sequelizeConnector.createWebhook(webhook);

                expect(createdWebhook).to.be.an('object');
                expect(createdWebhook).to.be.deep.contain(webhookWithEvents.dataValues);
                expect(createdWebhook.events).to.be.deep.equal(events);
                expect(createdWebhook).to.have.a.property('id');
            });
        });
    });
    describe('deleteWebhook', function() {
        describe('Happy flow', function() {
            it('expect to delete by query with proper webhook_id', async function() {
                const id = uuid.v4();
                const queryOptions = { where: { id } };

                sequelizeDeleteStub.resolves();
                await sequelizeConnector.deleteWebhook(id);

                expect(sequelizeDeleteStub.calledOnce).to.equal(true);

                const destroyOptions = sequelizeDeleteStub.args[0][0];
                expect(destroyOptions).to.deep.equal(queryOptions);
            });
        });
    });

    describe('updateWebhook', function() {
        it('update webhook name', async function() {
            const id = uuid.v4();
            const eventId = uuid.v4();
            const eventsDataValues = {
                id: eventId,
                name: WEBHOOK_EVENT_TYPE_STARTED
            };
            const event = {
                ...eventsDataValues,
                dataValues: {
                    ...eventsDataValues
                }
            };
            const dataValues = {
                id,
                name: 'avi',
                url: 'http://avi.com',
                global: false,
                format: 'slack',
                events: [event]
            };
            const oldWebhook = {
                id,
                name: 'avi',
                url: 'http://avi.com',
                global: false,
                format: 'slack',
                dataValues,
                events: [event],
                setEvents: sandbox.stub()
            };
            const updatedWebhook = {
                ...oldWebhook,
                name: 'iva'
            };
            const updatedWebhookFromDB = {
                ...updatedWebhook.dataValues,
                name: updatedWebhook.name,
                dataValues: {
                    ...updatedWebhook.dataValues,
                    name: updatedWebhook.name
                }
            };
            const transaction = {};

            sequelizeGetStub.onCall(0).resolves(oldWebhook);
            sequelizeGetStub.onCall(1).resolves([event]);
            sequelizeGetStub.onCall(2).resolves(updatedWebhookFromDB);
            sequelizeTransactionStub.resolves();
            oldWebhook.setEvents.resolves();
            sequelizeUpdateStub.resolves();

            const updateResult = await sequelizeConnector.updateWebhook(id, updatedWebhook);
            await sequelizeTransactionStub.yield(transaction);

            expect(sequelizeTransactionStub.calledOnce).to.be.equal(true);
            expect(oldWebhook.setEvents.calledOnce).to.be.equal(true);
            expect(sequelizeUpdateStub.calledOnce).to.be.equal(true);

            expect(updateResult).to.be.deep.equal({
                id,
                events: [WEBHOOK_EVENT_TYPE_STARTED],
                format: 'slack',
                global: false,
                name: 'iva',
                url: 'http://avi.com'
            });
            expect(oldWebhook.setEvents.args[0]).to.be.deep.equal([[event.id], { transaction }]);
            expect(sequelizeUpdateStub.args[0]).to.be.deep.equal([updatedWebhook, { where: { id }, transaction }]);
        });
    });
    describe('getAllGlobalWebhooks', function() {
        it('should have global: true where statement', async function() {
            const globalWebhooks = [
                {
                    name: 'niv',
                    url: 'http://predator.niv',
                    global: true,
                    events: [],
                    format: 'slack'
                },
                {
                    name: 'niv22',
                    url: 'http://predator2.niv',
                    global: true,
                    events: [],
                    format: 'json'
                }
            ];
            const globalWebhooksFromDB = globalWebhooks.map(globWebhook => ({ ...globWebhook, dataValues: { ...globWebhook } }))
            sequelizeGetStub.resolves(globalWebhooksFromDB);

            const resultWebhooks = await sequelizeConnector.getAllGlobalWebhooks();

            expect(sequelizeGetStub.calledOnce).to.be.equal(true);
            expect(sequelizeGetStub.args[0]).to.be.deep.equal([{ include: ['events'], where: { global: true } }]);
            expect(resultWebhooks).to.be.deep.equal(globalWebhooks);
        });
    });
});
