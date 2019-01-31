'use strict';

const schedulerSequlizeConnector = require('../../scheduler/models/database/sequelize/sequelizeConnector');
const repoterSequlizeConnector = require('../../reporter/models/database/sequelize/sequelizeConnector');
const testsSequlizeConnector = require('../../tests/models/database/sequelize/sequelizeConnector');

const databaseConfig = require('../../config/databaseConfig');
const Sequelize = require('sequelize');
let sequlizeClient;

module.exports.init = async () => {
    sequlizeClient = await createClient();
    await schedulerSequlizeConnector.init(sequlizeClient);
    await repoterSequlizeConnector.init(sequlizeClient);
    await testsSequlizeConnector.init(sequlizeClient);
};

module.exports.ping = async () => {
    try {
        await sequlizeClient.authenticate();
    } catch (error) {
        throw new Error('Error occurred in communication with database: ' + error.message);
    }
};

module.exports.closeConnection = () => {
    sequlizeClient.close();
};

async function createClient() {
    let options = {
        dialect: databaseConfig.type.toLowerCase(),
        define: {
            underscored: true
        }
    };

    if (databaseConfig.type === 'SQLITE') {
        options.storage = databaseConfig.sqliteStorage;
    }

    let client = new Sequelize(databaseConfig.name.toLowerCase(), databaseConfig.username, databaseConfig.password, options);
    await client.authenticate();
    return client;
}