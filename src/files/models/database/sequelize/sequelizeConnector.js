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
        },
        context_id: {
            type: Sequelize.DataTypes.STRING
        }
    });

    await file.sync();
}

async function saveFile(id, fileName, fileContent, contextId) {
    const fileClient = client.model('file');
    const params = {
        id: id,
        name: fileName,
        file: fileContent,
        context_id: contextId
    };

    const result = fileClient.create(params);
    return result;
}

async function getFile(id, isIncludeContent, contextId) {
    const fileClient = client.model('file');
    const options = {
        attributes: { exclude: ['updated_at', 'created_at'] },
        where: { id }
    };

    if (!isIncludeContent) {
        options.attributes.exclude.push('file');
    }

    if (contextId) {
        options.where.context_id = contextId;
    }

    const dbResult = await fileClient.findOne(options);
    return dbResult;
}
