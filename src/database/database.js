'use strict';

const sequelizeConnector = require('./sequlize-handler/sequlize');
const databaseConnector = sequelizeConnector;

module.exports.init = () => {
    return databaseConnector.init();
};

module.exports.ping = () => {
    return databaseConnector.ping();
};

module.exports.closeConnection = () => {
    return databaseConnector.closeConnection();
};
