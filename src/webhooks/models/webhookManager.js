'use strict';

const databaseConnector = require('./database/databaseConnector');
const { ERROR_MESSAGES } = require('../../common/consts');

const webhookDefaultValues = {
    global: false
};

module.exports.getAllWebhooks = async function () {
    let getAllWebhooks = await databaseConnector.getAllWebhooks();
    return getAllWebhooks;
};

module.exports.getWebhook = async function (webhookId) {
    const webhook = await databaseConnector.getWebhook(webhookId);
    if (!webhook) {
        const error = new Error(ERROR_MESSAGES.NOT_FOUND);
        error.statusCode = 404;
        throw error;
    }
    return webhook;
};

module.exports.createWebhook = async function(webhookInfo) {
    const webhook = {
        ...webhookDefaultValues,
        ...webhookInfo
    };
    return databaseConnector.createWebhook(webhook);
};

module.exports.deleteWebhook = async function(webhookId) {
    return databaseConnector.deleteWebhook(webhookId);
};