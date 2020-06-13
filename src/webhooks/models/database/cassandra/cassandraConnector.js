let logger = require('../../../../common/logger');

module.exports = {
    init,
    getAllProcessors
};

async function init() {
    const errorMessage = 'Webhooks feature is not implemented over Cassandra';
    logger.fatal(errorMessage);
    throw new Error(errorMessage);
}

async function getAllProcessors() {
    throw new Error('Not implemented.');
}
