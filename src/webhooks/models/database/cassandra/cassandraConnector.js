let logger = require('../../../../common/logger');

module.exports = {
    init,
    getAllWebhooks
};

async function init() {
    const errorMessage = 'Webhooks feature is not implemented over Cassandra';
    logger.fatal(errorMessage);
    throw new Error(errorMessage);
}

async function getAllWebhooks() {
    throw new Error('Not implemented.');
}
