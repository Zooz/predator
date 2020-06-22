'use strict';

const databaseConnector = require('./database/databaseConnector');

const webhookDefaultValues = {
    global: false
};

module.exports.getAllWebhooks = async function () {
    let getAllWebhooks = await databaseConnector.getAllWebhooks();
    return getAllWebhooks;
};

module.exports.createWebhook = async function(webhookInfo) {
    const webhook = {
        ...webhookDefaultValues,
        ...webhookInfo
    };
    return databaseConnector.createWebhook(webhook);
};