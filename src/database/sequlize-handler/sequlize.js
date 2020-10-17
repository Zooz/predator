'use strict';

const path = require('path');
const Umzug = require('umzug');
const schedulerSequlizeConnector = require('../../jobs/models/database/sequelize/sequelizeConnector');
const reportsSequlizeConnector = require('../../reports/models/database/sequelize/sequelizeConnector');
const testsSequlizeConnector = require('../../tests/models/database/sequelize/sequelizeConnector');
const configSequlizeConnector = require('../../configManager/models/database/sequelize/sequelizeConnector');
const processorsSequlizeConnector = require('../../processors/models/database/sequelize/sequelizeConnector');
const fileSequlizeConnector = require('../../files/models/database/sequelize/sequelizeConnector');
const contextSequlizeConnector = require('../../contexts/models/database/sequelize/sequelizeConnector');
const logger = require('../../../src/common/logger');
const databaseConfig = require('../../config/databaseConfig');
const webhooksSequlizeConnector = require('../../webhooks/models/database/sequelize/sequelizeConnector');
const Sequelize = require('sequelize');
let sequlizeClient;

module.exports.init = async () => {
    sequlizeClient = await createClient();
    await webhooksSequlizeConnector.init(sequlizeClient);
    await schedulerSequlizeConnector.init(sequlizeClient);
    await reportsSequlizeConnector.init(sequlizeClient);
    await testsSequlizeConnector.init(sequlizeClient);
    await configSequlizeConnector.init(sequlizeClient);
    await processorsSequlizeConnector.init(sequlizeClient);
    await fileSequlizeConnector.init(sequlizeClient);
    await contextSequlizeConnector.init(sequlizeClient);
    await runSequlizeMigrations();
    await sequlizeClient.sync();
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
    const options = {
        dialect: databaseConfig.type.toLowerCase(),
        logging: false,
        host: databaseConfig.address,
        define: {
            underscored: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at'
        }
    };

    if (databaseConfig.type === 'SQLITE') {
        options.storage = databaseConfig.sqliteStorage;
    }

    const client = new Sequelize(databaseConfig.name.toLowerCase(), databaseConfig.username, databaseConfig.password, options);
    await client.authenticate();
    return client;
}

async function runSequlizeMigrations() {
    const umzug = new Umzug({
        storage: 'sequelize',

        storageOptions: {
            sequelize: sequlizeClient
        },

        migrations: {
            params: [
                sequlizeClient.getQueryInterface(),
                Sequelize
            ],
            path: path.join(__dirname, './migrations')
        }
    });

    try {
        await umzug.up();
    } catch (error) {
        logger.error(error, 'Failed to run sequlize migration, doing rollback');
        await umzug.down();
        throw error;
    }
}
