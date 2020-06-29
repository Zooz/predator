'use strict';
let webhookManager = require('../models/webhookManager');

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
    let webhookId = req.params.webhook_id;
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
    let webhookId = req.params.webhook_id;
    try {
        await webhookManager.deleteWebhook(webhookId);
        return res.status(204).json();
    } catch (err) {
        return next(err);
    }
};