'use strict';
const httpContext = require('express-http-context');

const databaseConnector = require('./database/sequelize/sequelizeConnector');
const { ERROR_MESSAGES, CONTEXT_ID } = require('../../common/consts');
const generateError = require('../../common/generateError');
const requestSender = require('../../common/requestSender');
const logger = require('../../common/logger');
const webhooksFormatter = require('./webhooksFormatter');

const webhookDefaultValues = {
    global: false
};

async function getAllWebhooks() {
    const contextId = httpContext.get(CONTEXT_ID);

    const getAllWebhooks = await databaseConnector.getAllWebhooks(contextId);
    return getAllWebhooks;
}

async function getWebhook(webhookId) {
    const contextId = httpContext.get(CONTEXT_ID);

    const webhook = await databaseConnector.getWebhook(webhookId, contextId);
    if (!webhook) {
        throw generateError(404, ERROR_MESSAGES.NOT_FOUND);
    }
    return webhook;
}

async function createWebhook(webhookInfo) {
    const contextId = httpContext.get(CONTEXT_ID);

    const webhook = {
        ...webhookDefaultValues,
        ...webhookInfo
    };
    return databaseConnector.createWebhook(webhook, contextId);
}

async function deleteWebhook(webhookId) {
    const contextId = httpContext.get(CONTEXT_ID);

    const webhook = await databaseConnector.getWebhook(webhookId, contextId);
    if (!webhook) {
        throw generateError(404, ERROR_MESSAGES.NOT_FOUND);
    }

    return databaseConnector.deleteWebhook(webhookId, contextId);
}

async function updateWebhook(webhookId, webhook) {
    const webhookInDB = await getWebhook(webhookId);
    if (!webhookInDB) {
        throw generateError(404, ERROR_MESSAGES.NOT_FOUND);
    }
    return databaseConnector.updateWebhook(webhookId, webhook);
}

async function getAllGlobalWebhooks() {
    const contextId = httpContext.get(CONTEXT_ID);

    return databaseConnector.getAllGlobalWebhooks(contextId);
}

async function fireSingleWebhook(webhook, payload) {
    try {
        await requestSender.send({
            method: 'POST',
            url: webhook.url,
            body: payload
        });
        logger.info(`Webhook fired successfully, url = ${webhook.url}`);
    } catch (requestError) {
        logger.error(`Webhook failed, url = ${webhook.url}`);
        throw requestError;
    }
}

function fireWebhooksPromisesArray(webhooks, eventType, jobId, testId, report, additionalInfo, options) {
    return webhooks.map(webhook => {
        const webhookPayload = webhooksFormatter.format(webhook.format_type, eventType, jobId, testId, report, additionalInfo, options);
        return fireSingleWebhook(webhook, webhookPayload);
    });
}

async function fireWebhookByEvent(job, eventType, report, additionalInfo = {}, options = {}) {
    const jobWebhooks = job.webhooks ? await Promise.all(job.webhooks.map(webhookId => getWebhook(webhookId))) : [];
    const globalWebhooks = await getAllGlobalWebhooks();
    const webhooks = [...jobWebhooks, ...globalWebhooks];
    const webhooksWithEventType = webhooks.filter(webhook => webhook.events.includes(eventType));
    if (webhooksWithEventType.length === 0) {
        return;
    }
    const webhooksPromises = fireWebhooksPromisesArray(webhooksWithEventType, eventType, job.id, job.test_id, report, additionalInfo, options);
    await Promise.allSettled(webhooksPromises);
}

module.exports = {
    getAllWebhooks,
    getWebhook,
    createWebhook,
    deleteWebhook,
    updateWebhook,
    fireWebhookByEvent
};
