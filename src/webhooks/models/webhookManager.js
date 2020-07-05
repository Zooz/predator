'use strict';

const databaseConnector = require('./database/databaseConnector');
const { ERROR_MESSAGES } = require('../../common/consts');
const generateError = require('../../common/generateError');

const webhookDefaultValues = {
    global: false
};

async function getAllWebhooks() {
    let getAllWebhooks = await databaseConnector.getAllWebhooks();
    return getAllWebhooks;
};

async function getWebhook(webhookId) {
    const webhook = await databaseConnector.getWebhook(webhookId);
    if (!webhook) {
        throw generateError(404, ERROR_MESSAGES.NOT_FOUND);
    }
    return webhook;
};

async function createWebhook(webhookInfo) {
    const webhook = {
        ...webhookDefaultValues,
        ...webhookInfo
    };
    return databaseConnector.createWebhook(webhook);
};

async function deleteWebhook(webhookId) {
    return databaseConnector.deleteWebhook(webhookId);
};

async function updateWebhook(webhookId, webhook) {
    const webhookInDB = await getWebhook(webhookId);
    if (!webhookInDB) {
        throw generateError(404, ERROR_MESSAGES.NOT_FOUND);
    }
    return databaseConnector.updateWebhook(webhookId, webhook);
};

module.exports = {
    getAllWebhooks,
    getWebhook,
    createWebhook,
    deleteWebhook,
    updateWebhook
};