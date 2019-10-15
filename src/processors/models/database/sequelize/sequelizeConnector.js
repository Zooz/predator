'use strict';

const Sequelize = require('sequelize');
let client;

module.exports = {
    init,
    insertProcessor
};

async function init(sequelizeClient) {
    client = sequelizeClient;
    await initSchemas();
}

async function insertProcessor(processorId, processorInfo) {
    const processor = client.model('processor');
    let params = {
        processor_id: processorId,
        name: processorInfo.name,
        description: processorInfo.description,
        type: processorInfo.type,
        file_url: processorInfo.file_url,
        javascript: processorInfo.javascript
    };
    return processor.create(params);
}

async function initSchemas() {
    const processorsFiles = client.define('processor', {
        processor_id: {
            type: Sequelize.DataTypes.UUID,
            primaryKey: true
        },
        name: {
            type: Sequelize.DataTypes.TEXT('medium')
        },
        description: {
            type: Sequelize.DataTypes.TEXT('long')
        },
        type: {
            type: Sequelize.DataTypes.TEXT('medium')
        },
        file_url: {
            type: Sequelize.DataTypes.TEXT('long')
        },
        javascript: {
            type: Sequelize.DataTypes.TEXT('long')
        }
    });
    await processorsFiles.sync();
}
