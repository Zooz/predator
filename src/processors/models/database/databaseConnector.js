'use strict';

let databaseConfig = require('../../../config/databaseConfig');
// let cassandraConnector = require('./cassandra/cassandraConnector');
let sequelizeConnector = require('./sequelize/sequelizeConnector');
let databaseConnector;

if (databaseConfig.type.toLowerCase() === 'cassandra') {
    throw new Error('Processors is not implemented yet over Cassandra');
} else {
    databaseConnector = sequelizeConnector;
}

module.exports = {
    init,
    getAllProcessors
};

async function init() {
    return databaseConnector.init();
}

async function getAllProcessors(from, limit) {
    return databaseConnector.getAllProcessors(from, limit);
}
