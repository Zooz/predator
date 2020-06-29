let databaseConfig = require('../../../config/databaseConfig');
let cassandraConnector = require('./cassandra/cassandraConnector');
let sequelizeConnector = require('./sequelize/sequelizeConnector');
let databaseConnector = databaseConfig.type.toLowerCase() === 'cassandra' ? cassandraConnector : sequelizeConnector;

module.exports = {
    init,
    getAllWebhooks,
    createWebhook,
    getWebhook,
    deleteWebhook,
    closeConnection
};

async function init() {
    return databaseConnector.init();
}

function closeConnection() {
    return databaseConnector.closeConnection();
}

async function getAllWebhooks(from, limit, exclude) {
    return databaseConnector.getAllWebhooks(from, limit, exclude);
}

async function createWebhook(webhook) {
    return databaseConnector.createWebhook(webhook);
}

async function getWebhook(webhookId) {
    return databaseConnector.getWebhook(webhookId);
}

async function deleteWebhook(webhookId) {
    return databaseConnector.deleteWebhook(webhookId);
};