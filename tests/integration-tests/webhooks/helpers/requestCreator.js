const request = require('supertest');
const expressApp = require('../../../../src/app');

let app;
const resourceUri = '/v1/webhooks';

module.exports = {
    init,
    createWebhook,
    getWebhooks,
    getWebhook,
    deleteWebhook,
    testWebhook,
    updateWebhook
};

async function init() {
    try {
        app = await expressApp();
    } catch (err){
        console.log(err);
        process.exit(1);
    }
}

function createWebhook(body, headers = { 'Content-Type': 'application/json' }) {
    return request(app)
        .post(resourceUri)
        .send(body)
        .set(headers)
        .expect(function(res){
            return res;
        });
}

function getWebhooks(headers = { 'Content-Type': 'application/json' }) {
    return request(app)
        .get(resourceUri)
        .set(headers)
        .expect(function (res) {
            return res;
        });
}

function getWebhook(webhookId, headers = { 'Content-Type': 'application/json' }) {
    return request(app)
        .get(`${resourceUri}/${webhookId}`)
        .set(headers)
        .expect(function (res) {
            return res;
        });
}

function deleteWebhook(webhookId, headers = { 'Content-Type': 'application/json' }) {
    return request(app)
        .delete(`${resourceUri}/${webhookId}`)
        .set(headers)
        .expect(function (res) {
            return res;
        });
}

function updateWebhook(webhookId, webhook, headers = { 'Content-Type': 'application/json' }) {
    return request(app)
        .put(`${resourceUri}/${webhookId}`)
        .send(webhook)
        .set(headers)
        .expect(function (res) {
            return res;
        });
}

function testWebhook(webhookId, headers = { 'Content-Type': 'application/json' }) {
    return request(app)
        .post(`${resourceUri}/${webhookId}/test`)
        .set(headers);
}