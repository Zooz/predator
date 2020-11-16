'use strict';
const webhookManager = require('../models/webhookManager');

module.exports.getAllWebhooks = async function (req, res, next) {
    let webhooks;
    try {
        webhooks = await webhookManager.getAllWebhooks();
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
    try {
        webhook = await webhookManager.createWebhook(req.body);
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

module.exports.testWebhook = async function(req, res, next) {
    const { params: { id: webhookId } } = req;
    try {
        const webhookStatusCode = await webhookManager.testWebhook(webhookId);
        return res.status(200).json({ webhook_status_code: webhookStatusCode });
    }
    catch (err) {
        return next(err);
    }
};
