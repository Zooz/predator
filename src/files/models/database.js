const sequelizeConnector = require('./database/sequelize/sequelizeConnector');

const databaseConnector = sequelizeConnector;

module.exports = {
    saveFile,
    getFile,
    getFileByName
};

async function saveFile(id, fileName, fileContent, contextId) {
    return databaseConnector.saveFile(id, fileName, fileContent, contextId);
}
async function getFile(id, isIncludeContent, contextId) {
    return databaseConnector.getFile(id, isIncludeContent, contextId);
}

async function getFileByName(name, isIncludeContent, contextId) {
    return databaseConnector.getFileByName(name, isIncludeContent, contextId);
}
