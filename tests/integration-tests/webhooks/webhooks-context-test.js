const { expect } = require('chai');
const uuid = require('uuid');

const { WEBHOOK_EVENT_TYPES, EVENT_FORMAT_TYPE_JSON, EVENT_FORMAT_TYPES, WEBHOOK_EVENT_TYPE_API_FAILURE, WEBHOOK_EVENT_TYPE_FAILED } = require('../../../src/common/consts');

const webhookRequestSender = require('./helpers/requestCreator');

describe('Webhooks api', function () {
    const contextId = uuid.v4().toString();
    const headersWithoutContext = { 'Content-Type': 'application/json' };
    const headersWithContext = { 'Content-Type': 'application/json', 'x-context-id': contextId };
    const headersWithRandomContext = { 'Content-Type': 'application/json', 'x-context-id': 'random' };

    let webhook, createWebhookWithContextResponse, createWebhookWithoutContextResponse;
    this.timeout(5000000);
    before(async function () {
        await webhookRequestSender.init();
    });

    describe('with contexts', function () {
        beforeEach(async function(){
            webhook = generateWebhook();
            webhook.context_id = contextId;
            createWebhookWithoutContextResponse = await webhookRequestSender.createWebhook(webhook, headersWithoutContext);
            expect(createWebhookWithoutContextResponse.statusCode).to.equal(201);

            createWebhookWithContextResponse = await webhookRequestSender.createWebhook(webhook, headersWithContext);
            expect(createWebhookWithContextResponse.statusCode).to.equal(201);
        });

        after(async function(){
            const webhooksResponse = await webhookRequestSender.getWebhooks();
            await Promise.all(webhooksResponse.body.map(hook => webhookRequestSender.deleteWebhook(hook.id)));
        });

        describe('GET webhook',async function() {
            it('retrieve the webhook with context_id header should return 200', async function() {
                const webhookId = createWebhookWithContextResponse.body.id;
                const getWebhookResponse = await webhookRequestSender.getWebhook(webhookId, headersWithContext);

                expect(getWebhookResponse.statusCode).to.equal(200);
                assertDeepWebhookEquality(webhook, getWebhookResponse.body);
            });
            it('retrieve the webhook with wrong context_id header should return 404', async function() {
                const webhookId = createWebhookWithContextResponse.body.id;
                const getWebhookResponse = await webhookRequestSender.getWebhook(webhookId, headersWithRandomContext);

                expect(getWebhookResponse.statusCode).to.equal(404);
            });
            it('retrieve the webhook without context_id header should return 200', async function() {
                const webhookId = createWebhookWithContextResponse.body.id;
                const getWebhookResponse = await webhookRequestSender.getWebhook(webhookId, headersWithoutContext);

                expect(getWebhookResponse.statusCode).to.equal(200);
                assertDeepWebhookEquality(webhook, getWebhookResponse.body);
            });
            it('retrieve the webhook created without context with a context_id header should return 404', async function() {
                const webhookId = createWebhookWithoutContextResponse.body.id;
                const getWebhookResponse = await webhookRequestSender.getWebhook(webhookId, headersWithContext);

                expect(getWebhookResponse.statusCode).to.equal(404);
            });
        })
        describe('GET webhooks',async function() {
            it('retrieve webhooks with context_id should return 1 webhook', async function() {
                const webhookId = createWebhookWithContextResponse.body.id;
                const getWebhookResponse = await webhookRequestSender.getWebhooks(headersWithContext);

                expect(getWebhookResponse.statusCode).to.equal(200);
                const webhook = getWebhookResponse.body.find((webhook) => webhook.id === webhookId);
                should(webhook).not.be.undefined();
            });
            it('retrieve webhooks with wrong context_id should return 0 webhook', async function() {
                const getWebhookResponse = await webhookRequestSender.getWebhooks(headersWithRandomContext);

                expect(getWebhookResponse.statusCode).to.equal(200);
                should(getWebhookResponse.body.length).eql(0);
            });
            it('retrieve webhooks without context should return all webhooks', async function() {
                const getWebhookResponse = await webhookRequestSender.getWebhooks(headersWithoutContext);

                expect(getWebhookResponse.statusCode).to.equal(200);

                const webhookWithContext = getWebhookResponse.body.find((webhook) => webhook.id === createWebhookWithContextResponse.body.id);
                const webhookWithoutContext = getWebhookResponse.body.find((webhook) => webhook.id === createWebhookWithoutContextResponse.body.id);
                should(webhookWithContext).not.be.undefined();
                should(webhookWithoutContext).not.be.undefined();
            });
        })
        describe('PUT webhooks',async function() {
            it('edit webhook with context-id header should return 200', async function() {
                const webhook = createWebhookWithContextResponse.body;
                const updatedName = `updated-name-${uuid.v4()}`;
                webhook.name = updatedName;

                const updateWebhookResponse = await webhookRequestSender.updateWebhook(webhook.id, webhook, headersWithContext);
                expect(updateWebhookResponse.statusCode).to.equal(200);

                const getWebhookResponse = await webhookRequestSender.getWebhook(webhook.id, headersWithContext);
                expect(getWebhookResponse.statusCode).to.equal(200);
                expect(getWebhookResponse.body.name).to.equal(updatedName);
            });
            it('edit webhook with wrong context-id header should return 404', async function() {
                const webhook = createWebhookWithContextResponse.body;
                const updateWebhookResponse = await webhookRequestSender.updateWebhook(webhook.id, webhook, headersWithRandomContext);
                expect(updateWebhookResponse.statusCode).to.equal(404);
            });
            it('edit webhook created with context without sending context-id header should return 200', async function() {
                const webhook = createWebhookWithContextResponse.body;
                const updatedName = `updated-name-${uuid.v4()}`;
                webhook.name = updatedName;

                const updateWebhookResponse = await webhookRequestSender.updateWebhook(webhook.id, webhook, headersWithoutContext);
                expect(updateWebhookResponse.statusCode).to.equal(200);

                const getWebhookResponse = await webhookRequestSender.getWebhook(webhook.id, headersWithoutContext);
                expect(getWebhookResponse.statusCode).to.equal(200);
                expect(getWebhookResponse.body.name).to.equal(updatedName);
            });
            it('edit webhook created without context with sending context-id header should return 404', async function() {
                const webhook = createWebhookWithoutContextResponse.body;

                const updateWebhookResponse = await webhookRequestSender.updateWebhook(webhook.id, webhook, headersWithContext);
                expect(updateWebhookResponse.statusCode).to.equal(404);
            });
        })
        describe('DELETE webhook',async function() {
            it('delete webhook with context_id should return 204', async function() {
                const webhookId = createWebhookWithContextResponse.body.id;
                const getWebhookResponse = await webhookRequestSender.deleteWebhook(webhookId, headersWithContext);

                expect(getWebhookResponse.statusCode).to.equal(204);
            });
            it('delete webhook with wrong context_id should return 404', async function() {
                const webhookId = createWebhookWithContextResponse.body.id;
                const getWebhookResponse = await webhookRequestSender.deleteWebhook(webhookId, headersWithRandomContext);

                expect(getWebhookResponse.statusCode).to.equal(404);
            });
            it('delete webhook created without context with sending context_id should return 404', async function() {
                const webhookId = createWebhookWithoutContextResponse.body.id;
                const getWebhookResponse = await webhookRequestSender.deleteWebhook(webhookId, headersWithContext);

                expect(getWebhookResponse.statusCode).to.equal(404);
            });
        })
    });
});

function generateWebhook(name = 'My webhook', url = 'https://humus.is.love/callback', events = WEBHOOK_EVENT_TYPES) {
    return {
        name,
        url,
        events,
        global: false,
        format_type: EVENT_FORMAT_TYPE_JSON
    };
}

function assertDeepWebhookEquality(webhook, webhookFromAPI) {
    const {
        id,
        events,
        ...restOfWebhook
    } = webhook;
    const {
        id: webhookFromAPIId,
        events: webhookFromAPIEvents,
        created_at: createdAt,
        updated_at: updatedAt,
        ...restwebhookFromAPI
    } = webhookFromAPI;
    expect(restOfWebhook).to.deep.equal(restwebhookFromAPI);
    expect(events).to.have.members(webhookFromAPIEvents);
}
