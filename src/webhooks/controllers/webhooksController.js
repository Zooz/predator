'use strict';
const webhookManager = require('../models/webhookManager');

module.exports.getAllWebhooks = async function (req, res) {
    let webhooks;
    try {
        webhooks = await webhookManager.getAllWebhooks(req.requestContext);
        res.code(200).send(webhooks);
    } catch (err) {
        res.send(err);
    }
};

module.exports.getWebhook = async function (req, res) {
    let webhook;
    const webhookId = req.params.webhook_id;
    try {
        webhook = await webhookManager.getWebhook(webhookId, req.requestContext);
        res.code(200).send(webhook);
    } catch (err) {
        res.send(err);
    }
};

module.exports.createWebhook = async function (req, res) {
    let webhook;
    try {
        webhook = await webhookManager.createWebhook(req.body, req.requestContext);
        res.code(201).send(webhook);
    } catch (err) {
        res.send(err);
    }
};

module.exports.deleteWebhook = async function (req, res) {
    const webhookId = req.params.webhook_id;
    try {
        await webhookManager.deleteWebhook(webhookId, req.requestContext);
        res.code(204).send();
    } catch (err) {
        res.send(err);
    }
};

module.exports.updateWebhook = async function (req, res) {
    const { body: updatedWebhook, params: { webhook_id: webhookId } } = req;
    try {
        const webhook = await webhookManager.updateWebhook(webhookId, updatedWebhook);
        res.code(200).send(webhook);
    } catch (err) {
        res.send(err);
    }
};

module.exports.testWebhook = async function(req, res) {
    try {
        const response = await webhookManager.testWebhook(req.body);
        res.code(200).send(response);
    }
    catch (err) {
        res.send(err);
    }
};
