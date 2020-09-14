const sequelizeConnector = require('./database/sequelize/sequelizeConnector');

const databaseConnector = sequelizeConnector;

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
