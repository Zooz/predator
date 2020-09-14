'use strict';

let sequelizeConnector = require('./sequlize-handler/sequlize');
let databaseConnector = sequelizeConnector;

module.exports.init = () => {
    return databaseConnector.init();
};

module.exports.ping = () => {
    return databaseConnector.ping();
};

module.exports.closeConnection = () => {
    return databaseConnector.closeConnection();
};
