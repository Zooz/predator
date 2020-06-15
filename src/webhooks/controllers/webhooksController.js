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
