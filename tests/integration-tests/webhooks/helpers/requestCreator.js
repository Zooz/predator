const request = require('supertest');
const expressApp = require('../../../../src/app');

let app;
const headers = { 'Content-Type': 'application/json' };
const resourceUri = '/v1/webhooks';

module.exports = {
    init,
    createWebhook,
    getWebhooks,
    getWebhook,
    deleteWebhook,
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

function createWebhook(body) {
    return request(app)
        .post(resourceUri)
        .send(body)
        .set(headers)
        .expect(function(res){
            return res;
        });
}

function getWebhooks() {
    return request(app)
        .get(resourceUri)
        .set(headers)
        .expect(function (res) {
            return res;
        });
}

function getWebhook(webhookId) {
    return request(app)
        .get(`${resourceUri}/${webhookId}`)
        .set(headers)
        .expect(function (res) {
            return res;
        });
}

function deleteWebhook(webhookId) {
    return request(app)
        .delete(`${resourceUri}/${webhookId}`)
        .set(headers)
        .expect(function (res) {
            return res;
        });
}

function updateWebhook(webhookId, webhook) {
    return request(app)
        .put(`${resourceUri}/${webhookId}`)
        .send(webhook)
        .set(headers)
        .expect(function (res) {
            return res;
        });
}