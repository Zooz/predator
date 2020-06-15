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

module.exports.createWebhook = async function (req, res, next) {
    let webhook;
    try {
        webhook = await webhookManager.createWebhook(req.body);
        return res.status(200).json(webhook);
    } catch (err) {
        return next(err);
    }
};