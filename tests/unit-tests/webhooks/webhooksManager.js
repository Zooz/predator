const sinon = require('sinon');
const { expect } = require('chai');
const uuid = require('uuid');

const databaseConnector = require('../../../src/webhooks/models/database/sequelize/sequelizeConnector');
const webhooksManager = require('../../../src/webhooks/models/webhookManager');
const webhooksFormatter = require('../../../src/webhooks/models/webhooksFormatter');
const { ERROR_MESSAGES, WEBHOOK_EVENT_TYPE_FINISHED, WEBHOOK_EVENT_TYPE_STARTED, WEBHOOK_EVENT_TYPE_FAILED } = require('../../../src/common/consts');
const requestSender = require('../../../src/common/requestSender');

describe('webhooksManager', () => {
    let sandbox;
    let databaseConnectorGetStub;
    let databaseConnectorGetAllStub;
    let databaseConnectorDeleteStub;
    let databaseConnectorUpdateStub;
    let databaseConnectorCreateStub;
    let databaseConnectorGetAllGlobalWebhooks;

    let requestSenderSendStub;

    let webhooksFormatterFormatStub;
    before('tests setup', function() {
        sandbox = sinon.sandbox.create();
        databaseConnectorGetStub = sandbox.stub(databaseConnector, 'getWebhook');
        databaseConnectorGetAllStub = sandbox.stub(databaseConnector, 'getAllWebhooks');
        databaseConnectorCreateStub = sandbox.stub(databaseConnector, 'createWebhook');
        databaseConnectorDeleteStub = sandbox.stub(databaseConnector, 'deleteWebhook');
        databaseConnectorUpdateStub = sandbox.stub(databaseConnector, 'updateWebhook');
        databaseConnectorGetAllGlobalWebhooks = sandbox.stub(databaseConnector, 'getAllGlobalWebhooks');

        webhooksFormatterFormatStub = sandbox.stub(webhooksFormatter, 'format');

        requestSenderSendStub = sandbox.stub(requestSender, 'send');
    });
    beforeEach('reset stubs', function() {
        sandbox.reset();
    });
    describe('#getWebhook', function() {
        it('should retrieve the webhook', async function() {
            const webhook = {
                id: uuid.v4(),
                name: 'Ariana Grande',
                url: 'www.someurl.com',
                global: false,
                events: ['started', 'finished']
            };
            databaseConnectorGetStub.resolves(webhook);

            const resultWebhook = await webhooksManager.getWebhook(webhook.id);

            expect(databaseConnectorGetStub.calledOnce).to.equal(true);
            expect(databaseConnectorGetStub.args[0][0]).to.equal(webhook.id);
            expect(resultWebhook).to.be.deep.equal(webhook);
        });
        it('should thrown an error for inexistent webhook', async function() {
            databaseConnectorGetStub.resolves(null);
            try {
                await webhooksManager.getWebhook(uuid.v4());
                throw new Error('Should have failed');
            } catch (error) {
                expect(error).to.be.an('Error');
                expect(error.statusCode).to.be.equal(404);
                expect(error.message).to.be.equal(ERROR_MESSAGES.NOT_FOUND);
            }
        });
    });
    describe('#getAllWebhooks', function() {
        it('should retrieve the webhooks array', async function() {
            const webhooks = [
                {
                    name: 'Jay-Z',
                    global: false,
                    url: 'https://jayz.com',
                    events: ['started']
                },
                {
                    name: 'Beyonce',
                    global: true,
                    url: 'https://beyonce.com',
                    events: ['started', 'api_failure']
                }
            ];
            databaseConnectorGetAllStub.resolves(webhooks);

            const webhooksResult = await webhooksManager.getAllWebhooks();

            expect(databaseConnectorGetAllStub.calledOnce).to.be.equal(true);
            expect(databaseConnectorGetAllStub.args[0]).to.be.deep.equal([]);
            expect(webhooksResult).to.be.deep.equal(webhooks);
        });
    });
    describe('#createWebhook', function() {
        it('should create the webhook and retrieve it with default value for global', async function() {
            const webhook = {
                name: 'hatul',
                url: 'http://meow.com',
                events: ['benchmark_passed']
            };
            const defaultValuesWithWebhook = {
                ...webhook,
                global: false
            };
            databaseConnectorCreateStub.resolves(defaultValuesWithWebhook);

            const resultWebhook = await webhooksManager.createWebhook(webhook);

            expect(databaseConnectorCreateStub.calledOnce).to.be.equal(true);
            expect(databaseConnectorCreateStub.args[0][0]).to.be.deep.equal(defaultValuesWithWebhook);
            expect(resultWebhook).to.be.deep.equal(defaultValuesWithWebhook);
        });
    });
    describe('#deleteWebhook', function() {
        it('should delete the webhook', async function() {
            const id = uuid.v4();

            databaseConnectorDeleteStub.resolves();

            await webhooksManager.deleteWebhook(id);

            expect(databaseConnectorDeleteStub.calledOnce).to.be.equal(true);
            expect(databaseConnectorDeleteStub.args[0][0]).to.be.equal(id);
        });
    });
    describe('#updateWebhook', function() {
        it('should update the webhook successfully', async function() {
            const id = uuid.v4();
            const webhook = {
                name: 'pie',
                url: 'http://cake.com',
                global: true,
                events: ['benchmark_failed']
            };
            const updatedWebhook = {
                id,
                ...webhook
            };

            databaseConnectorGetStub.resolves(webhook);
            databaseConnectorUpdateStub.resolves(updatedWebhook);

            const resultWebhook = await webhooksManager.updateWebhook(id, webhook);

            expect(databaseConnectorUpdateStub.calledOnce).to.be.equal(true);
            expect(databaseConnectorUpdateStub.args[0]).to.be.deep.equal([id, webhook]);
            expect(resultWebhook).to.be.deep.equal(updatedWebhook);
        });
        it('should fail on inexistent webhook', async function() {
            const id = uuid.v4();
            const webhook = {
                name: 'pie',
                url: 'http://cake.com',
                global: true,
                events: ['benchmark_failed']
            };
            databaseConnectorGetStub.resolves(null);

            try {
                await webhooksManager.updateWebhook(id, webhook);
                throw new Error('Should have thrown an error');
            } catch (error) {
                expect(error).to.be.an('Error');
                expect(error.statusCode).to.be.equal(404);
                expect(error.message).to.be.equal(ERROR_MESSAGES.NOT_FOUND);
            }

        });
    });
    describe('#fireWebhookByEvent', function() {
        it('should not fire requests if there are no webhooks', async function() {
            const job = {
                webhooks: []
            };
            const report = {};

            databaseConnectorGetAllGlobalWebhooks.resolves([]);

            await webhooksManager.fireWebhookByEvent(job, WEBHOOK_EVENT_TYPE_FINISHED, report);

            expect(databaseConnectorGetStub.callCount).to.be.equal(0);
            expect(requestSenderSendStub.callCount).to.be.equal(0);
        });
        it('should fire 2 requests from jobs with no global webhooks', async function () {
            const webhooks = [
                {
                    id: uuid.v4(),
                    name: 'avi',
                    url: 'http://avi.com',
                    global: false,
                    events: [WEBHOOK_EVENT_TYPE_STARTED, WEBHOOK_EVENT_TYPE_FAILED]
                },
                {
                    id: uuid.v4(),
                    name: 'itzik',
                    url: 'http://itzik.com',
                    global: false,
                    events: [WEBHOOK_EVENT_TYPE_STARTED]
                }
            ];
            const job = {
                webhooks: webhooks.map(webhook => webhook.id)
            };
            const report = {};
            const format = 'some text';

            webhooksFormatterFormatStub.returns(format);
            webhooks.forEach((webhook) => databaseConnectorGetStub.withArgs(webhook.id).resolves(webhook));
            databaseConnectorGetAllGlobalWebhooks.resolves([]);
            requestSenderSendStub.resolves();

            await webhooksManager.fireWebhookByEvent(job, WEBHOOK_EVENT_TYPE_STARTED, report);

            expect(databaseConnectorGetStub.callCount).to.be.equal(2);
            expect(databaseConnectorGetStub.args).to.be.deep.equal([ [webhooks[0].id], [webhooks[1].id] ]);

            expect(requestSenderSendStub.callCount).to.be.equal(2);
            expect(requestSenderSendStub.args[0][0]).to.be.deep.equal({
                method: 'POST',
                url: webhooks[0].url,
                body: format
            });
            expect(requestSenderSendStub.args[1][0]).to.be.deep.equal({
                method: 'POST',
                url: webhooks[1].url,
                body: format
            });

            expect(webhooksFormatterFormatStub.callCount).to.be.equal(2);
        });
        it('should fire 1 request from jobs with no global webhooks, only 1 webhook event match', async function () {
            const webhooks = [
                {
                    id: uuid.v4(),
                    name: 'avi',
                    url: 'http://avi.com',
                    global: false,
                    events: [WEBHOOK_EVENT_TYPE_STARTED, WEBHOOK_EVENT_TYPE_FAILED]
                },
                {
                    id: uuid.v4(),
                    name: 'itzik',
                    url: 'http://itzik.com',
                    global: false,
                    events: [WEBHOOK_EVENT_TYPE_STARTED]
                }
            ];
            const job = {
                webhooks: webhooks.map(webhook => webhook.id)
            };
            const report = {};
            const format = 'some text';

            webhooksFormatterFormatStub.returns(format);
            webhooks.forEach((webhook) => databaseConnectorGetStub.withArgs(webhook.id).resolves(webhook));
            databaseConnectorGetAllGlobalWebhooks.resolves([]);
            requestSenderSendStub.resolves();

            await webhooksManager.fireWebhookByEvent(job, WEBHOOK_EVENT_TYPE_FAILED, report);

            expect(databaseConnectorGetStub.callCount).to.be.equal(2);
            expect(databaseConnectorGetStub.args).to.be.deep.equal([[webhooks[0].id], [webhooks[1].id]]);

            expect(requestSenderSendStub.callCount).to.be.equal(1);
            expect(requestSenderSendStub.args[0][0]).to.be.deep.equal({
                method: 'POST',
                url: webhooks[0].url,
                body: format
            });

            expect(webhooksFormatterFormatStub.callCount).to.be.equal(1);
        });
        it('should fire 2 requests from jobs with a global webhooks, only 2 webhooks event match', async function () {
            const webhooks = [
                {
                    id: uuid.v4(),
                    name: 'avi',
                    url: 'http://avi.com',
                    global: false,
                    events: [WEBHOOK_EVENT_TYPE_STARTED, WEBHOOK_EVENT_TYPE_FAILED]
                },
                {
                    id: uuid.v4(),
                    name: 'itzik',
                    url: 'http://itzik.com',
                    global: false,
                    events: [WEBHOOK_EVENT_TYPE_FAILED]
                }
            ];
            const globalWebhook = {
                id: uuid.v4(),
                name: 'shoshana',
                global: true,
                url: 'http://best.url.ever.com',
                events: [WEBHOOK_EVENT_TYPE_STARTED]
            };
            const job = {
                webhooks: webhooks.map(webhook => webhook.id)
            };
            const report = {};
            const format = 'some text';

            webhooksFormatterFormatStub.returns(format);
            webhooks.forEach((webhook) => databaseConnectorGetStub.withArgs(webhook.id).resolves(webhook));
            databaseConnectorGetAllGlobalWebhooks.resolves([globalWebhook]);
            requestSenderSendStub.resolves();

            await webhooksManager.fireWebhookByEvent(job, WEBHOOK_EVENT_TYPE_STARTED, report);

            expect(databaseConnectorGetStub.callCount).to.be.equal(2);
            expect(databaseConnectorGetStub.args).to.be.deep.equal([[webhooks[0].id], [webhooks[1].id]]);

            expect(requestSenderSendStub.callCount).to.be.equal(2);
            expect(requestSenderSendStub.args[0][0]).to.be.deep.equal({
                method: 'POST',
                url: webhooks[0].url,
                body: format
            });
            expect(requestSenderSendStub.args[1][0]).to.be.deep.equal({
                method: 'POST',
                url: globalWebhook.url,
                body: format
            });

            expect(webhooksFormatterFormatStub.callCount).to.be.equal(2);
        });
        it('should fire 0 requests from jobs and 1 from a global webhooks, only 1 webhooks event match', async function () {
            const webhooks = [];
            const globalWebhook = {
                id: uuid.v4(),
                name: 'shoshana',
                global: true,
                url: 'http://best.url.ever.com',
                events: [WEBHOOK_EVENT_TYPE_STARTED]
            };
            const job = {
                webhooks: webhooks.map(webhook => webhook.id)
            };
            const report = {};
            const format = 'some text';

            webhooksFormatterFormatStub.returns(format);
            webhooks.forEach((webhook) => databaseConnectorGetStub.withArgs(webhook.id).resolves(webhook));
            databaseConnectorGetAllGlobalWebhooks.resolves([globalWebhook]);
            requestSenderSendStub.resolves();

            await webhooksManager.fireWebhookByEvent(job, WEBHOOK_EVENT_TYPE_STARTED, report);

            expect(databaseConnectorGetStub.callCount).to.be.equal(0);
            expect(requestSenderSendStub.callCount).to.be.equal(1);
            expect(requestSenderSendStub.args[0][0]).to.be.deep.equal({
                method: 'POST',
                url: globalWebhook.url,
                body: format
            });
            expect(webhooksFormatterFormatStub.callCount).to.be.equal(1);
        });
        it('should fire 2 requests from jobs with no global webhooks, 1 webhook fails', async function () {
            const webhooks = [
                {
                    id: uuid.v4(),
                    name: 'avi',
                    url: 'http://avi.com',
                    global: false,
                    events: [WEBHOOK_EVENT_TYPE_STARTED, WEBHOOK_EVENT_TYPE_FAILED]
                },
                {
                    id: uuid.v4(),
                    name: 'itzik',
                    url: 'http://itzik.com',
                    global: false,
                    events: [WEBHOOK_EVENT_TYPE_STARTED]
                }
            ];
            const globalWebhook = {
                id: uuid.v4(),
                name: 'shoshana',
                global: true,
                url: 'http://best.url.ever.com',
                events: [WEBHOOK_EVENT_TYPE_STARTED]
            };
            const job = {
                webhooks: webhooks.map(webhook => webhook.id)
            };
            const report = {};
            const format = 'some text';

            webhooksFormatterFormatStub.returns(format);
            webhooks.forEach((webhook) => databaseConnectorGetStub.withArgs(webhook.id).resolves(webhook));
            databaseConnectorGetAllGlobalWebhooks.resolves([globalWebhook]);
            requestSenderSendStub.resolves();
            requestSenderSendStub.withArgs({
                method: 'POST',
                url: globalWebhook.url,
                body: format
            }).rejects();

            await webhooksManager.fireWebhookByEvent(job, WEBHOOK_EVENT_TYPE_STARTED, report);

            expect(databaseConnectorGetStub.callCount).to.be.equal(2);
            expect(databaseConnectorGetStub.args).to.be.deep.equal([[webhooks[0].id], [webhooks[1].id]]);

            expect(requestSenderSendStub.callCount).to.be.equal(3);
            expect(requestSenderSendStub.args[0][0]).to.be.deep.equal({
                method: 'POST',
                url: webhooks[0].url,
                body: format
            });
            expect(requestSenderSendStub.args[1][0]).to.be.deep.equal({
                method: 'POST',
                url: webhooks[1].url,
                body: format
            });
            expect(requestSenderSendStub.args[2][0]).to.be.deep.equal({
                method: 'POST',
                url: globalWebhook.url,
                body: format
            });

            expect(webhooksFormatterFormatStub.callCount).to.be.equal(3);
        });
    });
});
