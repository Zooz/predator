'use strict';

const databaseConnector = require('./sequlize-handler/sequlize');

module.exports.init = () => {
    return databaseConnector.init();
};

module.exports.ping = () => {
    return databaseConnector.ping();
};

module.exports.closeConnection = () => {
    return databaseConnector.closeConnection();
};
