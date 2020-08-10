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

// TEST THIS FUNCTION
async function getAllGlobalWebhooks() {
    return databaseConnector.getAllGlobalWebhooks();
}

async function fireSingleWebhook(webhook, payload) {
    let webhookResponse = null;
    try {
        webhookResponse = await requestSender.send({
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

//format, eventType, jobId, testId, report, additionalInfo = {}, options = {}
function fireWebhooks(webhooks, eventType, jobId, testId, report, additionalInfo, options) {
    return webhooks.map(webhook => fireSingleWebhook(webhook, webhooksFormatter(webhook.format_type, eventType, jobId, testId, report, additionalInfo, options)));
}

// FAILED: report, stats
// STARTED: report
// IN_PROGRESS: report, aggregatedReport
// report, aggregatedReport, reportBenchmark
// BENCHMARK_FAILED/PASSED: report, aggregatedReport, score, lastScores, icon
// ABORTED: report
async function fireWebhookByEvent(job, eventType, report, additionalInfo = {}, options = {}) {
    const jobWebhooks = await Promise.all(job.webhooks.map(webhookId => getWebhook(webhookId)));
    const globalWebhooks = await getAllGlobalWebhooks();
    const webhooks = [...jobWebhooks, ...globalWebhooks];
    const webhooksWithEventType = webhooks.filter(webhook => webhook.events.includes(eventType));
    if (webhooksWithEventType.length === 0) {
        return;
    }
    const webhooksPromises = fireWebhooks(webhooksWithEventType, eventType, job.id, job.test_id, report, additionalInfo, options);
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
