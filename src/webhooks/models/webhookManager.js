'use strict';

const databaseConnector = require('./database/databaseConnector');

module.exports.getAllWebhooks = async function () {
    let getAllWebhooks = await databaseConnector.getAllWebhooks();
    return getAllWebhooks;
};
