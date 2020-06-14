const cassandraConnector = require('./database/cassandra/cassandraConnector'),
    sequelizeConnector = require('./database/sequelize/sequelizeConnector'),
    databaseConfig = require('../../config/databaseConfig'),
    databaseConnector = databaseConfig.type.toLowerCase() === 'cassandra' ? cassandraConnector : sequelizeConnector;

module.exports = {
    saveFile,
    getFile
};

async function saveFile(id, fileName, fileContent) {
    return databaseConnector.saveFile(id, fileName, fileContent);
}
async function getFile(id, isIncludeContent) {
    return databaseConnector.getFile(id, isIncludeContent);
}
