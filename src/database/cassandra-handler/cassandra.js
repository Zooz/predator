'use strict';

const schedulerCassandraConnector = require('../../jobs/models/database/cassandra/cassandraConnector');
const reportsCassandraConnector = require('../../reports/models/database/cassandra/cassandraConnector');
const testsCassandraConnector = require('../../tests/models/database/cassandra/cassandraConnector');
const configCassandraConnector = require('../../configManager/models/database/cassandra/cassandraConnector');
const processorsSequlizeConnector = require('../../processors/models/database/cassandra/cassandraConnector');
const databaseConfig = require('../../config/databaseConfig');
const cassandraMigration = require('./cassandraMigration');
const logger = require('../../common/logger');
const cassandra = require('cassandra-driver');
let cassandraClient;

module.exports.init = async () => {
    cassandraClient = await createClient();
    await cassandraMigration.runMigration();
    await reportsCassandraConnector.init(cassandraClient);
    await schedulerCassandraConnector.init(cassandraClient);
    await testsCassandraConnector.init(cassandraClient);
    await configCassandraConnector.init(cassandraClient);
    await processorsSequlizeConnector.init(cassandraClient);
    logger.info('cassandra client initialized');
};

module.exports.ping = () => {
    const query = 'SELECT * FROM system_schema.keyspaces where keyspace_name=?';
    let queryParams = [databaseConfig.name];
    return cassandraClient.execute(query, queryParams)
        .then(function (results) {
            if (!results.rows || results.rows.length <= 0) {
                return Promise.reject(new Error('Key space wasn\'t found'));
            } else {
                return Promise.resolve(true);
            }
        }).catch(function () {
            return Promise.reject(new Error('Error occurred in communication with cassandra'));
        });
};

module.exports.closeConnection = () => {
    return new Promise((resolve, reject) => {
        if (cassandraClient) {
            try {
                cassandraClient.shutdown();
                logger.info('Cassandra client shutdown successful');
                return resolve();
            } catch (exception) {
                logger.error('Failed to close Cassandra connections' + exception);
                return reject(exception);
            }
        } else {
            logger.info('Cassandra client shutdown successful');
            return resolve();
        }
    });
};

async function createClient() {
    const authProvider = new cassandra.auth.PlainTextAuthProvider(databaseConfig.username, databaseConfig.password);
    const config = {
        contactPoints: String(databaseConfig.address).split(','),
        keyspace: databaseConfig.name,
        authProvider,
        localDataCenter: databaseConfig.cassandraLocalDataCenter
    };

    let cassandraClient = new cassandra.Client(config);
    return cassandraClient;
}
