'use strict';

let databaseConfig = require('../config/databaseConfig');
let cassandraConnector = require('./cassandra-handler/cassandra');
let sequelizeConnector = require('./sequlize-handler/sequlize');
let databaseConnector = databaseConfig.type.toLowerCase() === 'cassandra' ? cassandraConnector : sequelizeConnector;
module.exports.init = () => {
    return databaseConnector.init();
};

module.exports.ping = () => {
    return databaseConnector.ping();
};

module.exports.closeConnection = () => {
    return databaseConnector.closeConnection();
};