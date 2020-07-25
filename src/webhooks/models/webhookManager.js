'use strict';

const databaseConnector = require('./database/databaseConnector');
const { ERROR_MESSAGES } = require('../../common/consts');
const generateError = require('../../common/generateError');
const requestSender = require('../../common/requestSender');
const logger = require('../../common/logger');
const webhooksFormatter = require('./webhooksFormatter');

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

async function getAllGlobalWebhooks() {
    return databaseConnector.getAllWebhooks();
}

async function fireSingleWebhook(webhook, payload) {
    let webhookResponse = null;
    try {
        webhookResponse = await requestSender.send({
            method: 'POST',
            url: webhook.url,
            body: payload
        });
        logger.info(`Webhook fired successfully, url=${webhook.url}`);
    } catch (requestError) {
        logger.error(`Webhook failed, url=${webhook.url}`);
        throw requestError;
    }
    return webhookResponse;
}

async function fireWebhooks(webhooks, payload) {
    return webhooks.map(webhook => fireSingleWebhook(webhook, webhooksFormatter[webhook.format_type](payload)));
}

async function fireWebhookByEvent(jobId, eventType, payload) {
    const job = await getWebhook(jobId);
    const globalWebhooks = await getAllGlobalWebhooks();
    const webhooks = [...job.webhooks, ...globalWebhooks];
    const webhooksWithEventType = webhooks.filter(webhook => webhook.events.include(eventType));
    if (webhooksWithEventType.length === 0) {
        return;
    }
    await Promise.allSettled(fireWebhooks(webhooksWithEventType, payload));
}

module.exports = {
    getAllWebhooks,
    getWebhook,
    createWebhook,
    deleteWebhook,
    updateWebhook,
    fireWebhookByEvent
};