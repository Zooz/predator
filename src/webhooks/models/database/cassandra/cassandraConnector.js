let logger = require('../../../../common/logger');

module.exports = {
    init,
    createWebhook,
    getAllWebhooks,
    updateWebhook
};

async function init() {
    const errorMessage = 'Webhooks feature is not implemented over Cassandra';
    logger.fatal(errorMessage);
    throw new Error(errorMessage);
}

async function getAllWebhooks() {
    throw new Error('Not implemented.');
}

async function createWebhook() {
    throw new Error('Not implemented.');
}

async function updateWebhook() {
    throw new Error('Not implemented.');
}
