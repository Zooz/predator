
const Sequelize = require('sequelize');
module.exports = {
    init,
    getFile,
    saveFile
};

let client;

async function init(sequlizeClient) {
    client = sequlizeClient;
    await initSchemas();
}

async function initSchemas() {
    const file = client.define('file', {
        id: {
            type: Sequelize.DataTypes.UUID,
            primaryKey: true
        },
        file: {
            type: Sequelize.DataTypes.TEXT('long')
        },
        name: {
            type: Sequelize.DataTypes.TEXT()
        }
    });
    await file.sync();
}

async function saveFile(id, fileName, fileContent) {
    const fileClient = client.model('file');
    let params = {
        id: id,
        name: fileName,
        file: fileContent

    };

    const result = fileClient.create(params);
    return result;
}

async function getFile(id) {
    const fileClient = client.model('file');
    const options = {
        attributes: { exclude: ['updated_at', 'created_at'] }
    };
    options.where = { id: id };
    const dbResult = await fileClient.findOne(options);
    return dbResult;
}
