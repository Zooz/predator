'use strict';

let Sequelize = require('sequelize');
let client;

module.exports = {
    init,
    getAllProcessors
};

async function init(sequelizeClient) {
    client = sequelizeClient;
    await initSchemas();
}

async function getAllProcessors(from, limit) {
    const processorsModel = client.model('processors');
    return processorsModel.findAll({ offset: from, limit });
}

async function initSchemas() {
    const processors = client.define('processors', {
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
    await processors.sync();
}
