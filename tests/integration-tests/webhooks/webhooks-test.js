const { expect } = require('chai');
const uuid = require('uuid');

const { WEBHOOK_EVENT_TYPES, EVENT_FORMAT_TYPE_JSON, EVENT_FORMAT_TYPES, WEBHOOK_EVENT_TYPE_API_FAILURE, WEBHOOK_EVENT_TYPE_FAILED } = require('../../../src/common/consts');

const webhookRequestSender = require('./helpers/requestCreator');

describe('Webhooks api', function () {
    this.timeout(5000000);
    before(async function () {
        await webhookRequestSender.init();
    });

    describe('Good requests', async function () {
        describe('GET /v1/webhooks', async function () {
            before('clean webhooks', async function() {
                const webhooksResponse = await webhookRequestSender.getWebhooks();
                await Promise.all(webhooksResponse.body.map(hook => webhookRequestSender.deleteWebhook(hook.id)));
            });
            const numOfWebhooksToInsert = 5;
            it(`return ${numOfWebhooksToInsert} webhooks`, async function() {
                const webhooksToInsert = (new Array(numOfWebhooksToInsert))
                    .fill(0, 0, numOfWebhooksToInsert)
                    .map(index => generateWebhook(`My webhook ${index}`));
                await Promise.all(webhooksToInsert.map(webhook => webhookRequestSender.createWebhook(webhook)));

                const webhooksGetResponse = await webhookRequestSender.getWebhooks();
                expect(webhooksGetResponse.statusCode).to.equal(200);

                const webhooks = webhooksGetResponse.body;
                expect(webhooks).to.be.an('array').and.have.lengthOf(numOfWebhooksToInsert);
            });
        });
        describe('GET /v1/webhooks/:webhook_id', function () {
            it('should retrieve the webhook that was created', async function() {
                const webhook = generateWebhook();
                const createWebhookResponse = await webhookRequestSender.createWebhook(webhook);
                expect(createWebhookResponse.statusCode).to.equal(201);

                const webhookId = createWebhookResponse.body.id;
                const getWebhookResponse = await webhookRequestSender.getWebhook(webhookId);

                expect(getWebhookResponse.statusCode).to.equal(200);
                assertDeepWebhookEquality(webhook, getWebhookResponse.body);
            });
        });
        describe('POST /v1/webhooks', function () {
            it('Create webhook and response 201 status code', async function() {
                const webhook = generateWebhook();
                const createWebhookResponse = await webhookRequestSender.createWebhook(webhook);
                expect(createWebhookResponse.statusCode).to.equal(201);
                assertDeepWebhookEquality(webhook, createWebhookResponse.body);
            });
            it('Create webhook with global=true and response 201 status code', async function() {
                const webhook = generateWebhook();
                webhook.global = true;

                const createWebhookResponse = await webhookRequestSender.createWebhook(webhook);

                expect(createWebhookResponse.statusCode).to.equal(201);
                assertDeepWebhookEquality(webhook, createWebhookResponse.body);
            });
            it('Create webhook with unspecified global field, expect default value and response 201 status code', async function() {
                const webhook = generateWebhook();
                const { global, ...webhookWithoutGlobal } = webhook;

                const createWebhookResponse = await webhookRequestSender.createWebhook(webhookWithoutGlobal);

                expect(createWebhookResponse.statusCode).to.equal(201);
                assertDeepWebhookEquality(webhook, createWebhookResponse.body);
            });
        });
        describe('DELETE /v1/webhooks/:webhook_id', function() {
            it('Create a webhook -> deleting it -> expecting to get 404 in GET', async function() {
                const webhook = generateWebhook();

                const insertWebhookResponse = await webhookRequestSender.createWebhook(webhook);
                expect(insertWebhookResponse.statusCode).to.equal(201);
                const webhookId = insertWebhookResponse.body.id;

                const deleteWebhookResponse = await webhookRequestSender.deleteWebhook(webhookId);
                expect(deleteWebhookResponse.statusCode).to.equal(204);

                const getWebhookResponse = await webhookRequestSender.getWebhook(webhookId);
                expect(getWebhookResponse.statusCode).to.equal(404);
            });
            it('Deleting unexisting webhook -> expect 204 status code', async function() {
                const id = uuid.v4();

                const deleteWebhookResponse = await webhookRequestSender.deleteWebhook(id);
                expect(deleteWebhookResponse.statusCode).to.equal(204);
            });
        });
        describe('PUT /v1/webhooks/:webhook_id', function() {
            it('Insert a webhook -> update global -> ensure it is updated', async function() {
                const webhook = generateWebhook();
                const updatedWebhook = { ...webhook, global: !webhook.global };

                const insertResponse = await webhookRequestSender.createWebhook(webhook);
                expect(insertResponse.statusCode).to.equal(201);

                const { body: { id } } = insertResponse;
                const putResponse = await webhookRequestSender.updateWebhook(id, updatedWebhook);

                expect(putResponse.statusCode).to.equal(200);
                assertDeepWebhookEquality(updatedWebhook, putResponse.body);

                const getResponse = await webhookRequestSender.getWebhook(id);
                assertDeepWebhookEquality(updatedWebhook, getResponse.body);
            });
            it('Insert a webhook -> update url -> ensure it is updated', async function() {
                const webhook = generateWebhook();
                const updatedWebhook = { ...webhook, url: `${webhook}/new/path` };

                const insertResponse = await webhookRequestSender.createWebhook(webhook);
                expect(insertResponse.statusCode).to.equal(201);

                const { body: { id } } = insertResponse;
                const putResponse = await webhookRequestSender.updateWebhook(id, updatedWebhook);

                expect(putResponse.statusCode).to.equal(200);
                assertDeepWebhookEquality(updatedWebhook, putResponse.body);

                const getResponse = await webhookRequestSender.getWebhook(id);
                assertDeepWebhookEquality(updatedWebhook, getResponse.body);
            });
            it('Insert a webhook -> update format_type -> ensure it is updated', async function() {
                const webhook = generateWebhook();
                const updatedFormatType = EVENT_FORMAT_TYPES.filter(format => format !== webhook.format_type)[0];
                const updatedWebhook = { ...webhook, format_type: updatedFormatType };

                const insertResponse = await webhookRequestSender.createWebhook(webhook);
                expect(insertResponse.statusCode).to.equal(201);

                const { body: { id } } = insertResponse;
                const putResponse = await webhookRequestSender.updateWebhook(id, updatedWebhook);

                expect(putResponse.statusCode).to.equal(200);
                assertDeepWebhookEquality(updatedWebhook, putResponse.body);

                const getResponse = await webhookRequestSender.getWebhook(id);
                assertDeepWebhookEquality(updatedWebhook, getResponse.body);
            });
            it('Insert a webhook -> update name -> ensure it is updated', async function() {
                const webhook = generateWebhook();
                const updatedWebhook = { ...webhook, name: webhook.name + ' added text' };

                const insertResponse = await webhookRequestSender.createWebhook(webhook);
                expect(insertResponse.statusCode).to.equal(201);

                const { body: { id } } = insertResponse;
                const putResponse = await webhookRequestSender.updateWebhook(id, updatedWebhook);

                expect(putResponse.statusCode).to.equal(200);
                assertDeepWebhookEquality(updatedWebhook, putResponse.body);

                const getResponse = await webhookRequestSender.getWebhook(id);
                assertDeepWebhookEquality(updatedWebhook, getResponse.body);
            });
            it('Insert a webhook -> update events -> ensure it is updated', async function() {
                const webhook = {
                    ...generateWebhook(),
                    events: [WEBHOOK_EVENT_TYPE_API_FAILURE]
                };
                const updatedWebhook = {
                    ...webhook,
                    events: [WEBHOOK_EVENT_TYPE_API_FAILURE, WEBHOOK_EVENT_TYPE_FAILED]
                };

                const insertResponse = await webhookRequestSender.createWebhook(webhook);
                expect(insertResponse.statusCode).to.equal(201);

                const { body: { id } } = insertResponse;
                const putResponse = await webhookRequestSender.updateWebhook(id, updatedWebhook);

                expect(putResponse.statusCode).to.equal(200);
                assertDeepWebhookEquality(updatedWebhook, putResponse.body);

                const getResponse = await webhookRequestSender.getWebhook(id);
                assertDeepWebhookEquality(updatedWebhook, getResponse.body);
            });
        });
    });

    describe('Bad requests', function () {
        describe('POST /v1/webhooks', function () {
            describe('name validation', function() {
                it('Create webhook with bad type of name', async function () {
                    const webhook = generateWebhook(5);

                    const createResponse = await webhookRequestSender.createWebhook(webhook);
                    expect(createResponse.statusCode).to.equal(400);
                });
            });
            describe('format_type validation', function() {
                it('Create webhook with bad format_type', async function () {
                    const webhook = generateWebhook();
                    webhook.format_type = 'TOTTALLY NOT A VALID FORMAT TYPE lalalalalla';

                    const createResponse = await webhookRequestSender.createWebhook(webhook);
                    expect(createResponse.statusCode).to.equal(400);
                });
            });
            describe('global validation', function() {
                it('Create webhook with global not a boolean', async function () {
                    const webhook = generateWebhook();
                    webhook.global = 'TOTTALLY NOT A VALID GLOBAL';

                    const createResponse = await webhookRequestSender.createWebhook(webhook);
                    expect(createResponse.statusCode).to.equal(400);
                });
            });
            describe('events validation', function() {
                it('Create webhook with empty events', async function () {
                    const webhook = generateWebhook();
                    webhook.events = [];

                    const createResponse = await webhookRequestSender.createWebhook(webhook);
                    expect(createResponse.statusCode).to.equal(400);
                });
                it('Create a webhook with invalid event name', async function () {
                    const webhook = generateWebhook('My special webhook', 'https://url.com/callback', ['bad_value']);

                    const createResponse = await webhookRequestSender.createWebhook(webhook);
                    expect(createResponse.statusCode).to.equal(400);
                });
                it('Create a webhook with duplicate event name', async function () {
                    const webhook = generateWebhook();
                    webhook.events = [webhook.events[0], webhook.events[0]];

                    const createResponse = await webhookRequestSender.createWebhook(webhook);
                    expect(createResponse.statusCode).to.equal(400);
                });
                it('Create a webhook with too many valid values', async function () {
                    const webhook = generateWebhook();
                    webhook.events = [...webhook.events, webhook.events[0]];

                    const createResponse = await webhookRequestSender.createWebhook(webhook);
                    expect(createResponse.statusCode).to.equal(400);
                });
            });
        });
        describe('GET /v1/webhooks/:webhook_id', function () {
            it('should return 400 for bad uuid', async function() {
                const badWebhookValue = 'lalallalalal';

                const response = await webhookRequestSender.getWebhook(badWebhookValue);

                expect(response.statusCode).to.equal(400);
            });
        });
        describe('DELETE /v1/webhooks/:webhook_id', function () {
            it('should return 400 for bad uuid', async function() {
                const badWebhookValue = 'lalallalalal';

                const response = await webhookRequestSender.deleteWebhook(badWebhookValue);

                expect(response.statusCode).to.equal(400);
            });
        });
        describe('PUT /v1/webhooks/:webhook_id', function() {
            it('should return 400 for bad uuid', async function() {
                const webhook = generateWebhook();
                const badWebhookValue = 'lalallalalal';

                const response = await webhookRequestSender.updateWebhook(badWebhookValue, webhook);

                expect(response.statusCode).to.equal(400);
            });
        });
    });

    describe('Sad requests', function() {
        describe('GET /v1/webhooks/:webhook_id', function () {
            it('should return 404 for no existing webhook', async function() {
                const notExistingWebhookId = uuid.v4();

                const response = await webhookRequestSender.getWebhook(notExistingWebhookId);

                expect(response.statusCode).to.equal(404);
            });
        });
        describe('PUT /v1/webhooks/:webhook_id', function () {
            it('should return 404 for no existing webhook', async function() {
                const notExistingWebhookId = uuid.v4();
                const webhook = generateWebhook();

                const response = await webhookRequestSender.updateWebhook(notExistingWebhookId, webhook);

                expect(response.statusCode).to.equal(404);
            });
        });
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
