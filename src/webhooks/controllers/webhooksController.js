'use strict';
const webhookManager = require('../models/webhookManager');
const { getContextIdFromHeaders, getContextIdFromQuery } = require('../../common/getContextIdFromRequest');

module.exports.getAllWebhooks = async function (req, res, next) {
    let webhooks;
    const contextId = getContextIdFromQuery(req.query);
    try {
        webhooks = await webhookManager.getAllWebhooks(contextId);
        return res.status(200).json(webhooks);
    } catch (err) {
        return next(err);
    }
};

module.exports.getWebhook = async function (req, res, next) {
    let webhook;
    const webhookId = req.params.webhook_id;
    try {
        webhook = await webhookManager.getWebhook(webhookId);
        return res.status(200).json(webhook);
    } catch (err) {
        return next(err);
    }
};

module.exports.createWebhook = async function (req, res, next) {
    let webhook;
    const contextId = getContextIdFromHeaders(req.headers);
    try {
        webhook = await webhookManager.createWebhook(req.body, contextId);
        return res.status(201).json(webhook);
    } catch (err) {
        return next(err);
    }
};

module.exports.deleteWebhook = async function (req, res, next) {
    const webhookId = req.params.webhook_id;
    try {
        await webhookManager.deleteWebhook(webhookId);
        return res.status(204).json();
    } catch (err) {
        return next(err);
    }
};

module.exports.updateWebhook = async function (req, res, next) {
    const { body: updatedWebhook, params: { webhook_id: webhookId } } = req;
    try {
        const webhook = await webhookManager.updateWebhook(webhookId, updatedWebhook);
        return res.status(200).json(webhook);
    } catch (err) {
        return next(err);
    }
};
