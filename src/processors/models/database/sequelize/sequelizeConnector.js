'use strict';

const Sequelize = require('sequelize');
let client;

module.exports = {
    init,
    getAllProcessors,
    insertProcessor,
    getProcessorById,
    getProcessorByName,
    deleteProcessor,
    updateProcessor
};

async function init(sequelizeClient) {
    client = sequelizeClient;
    await initSchemas();
}

async function insertProcessor(processorId, processorInfo) {
    const processor = client.model('processor');
    let params = {
        id: processorId,
        name: processorInfo.name,
        description: processorInfo.description,
        javascript: processorInfo.javascript,
        created_at: Date.now(),
        updated_at: Date.now()
    };
    return processor.create(params);
}

async function getAllProcessors(from, limit) {
    const processorsModel = client.model('processor');
    return processorsModel.findAll({ raw: true, offset: from, limit, order: [['created_at', 'DESC']] });
}

async function _getProcessor(options) {
    const processorsModel = client.model('processor');
    let processors = await processorsModel.findAll(Object.assign(options, { raw: true }));
    return processors[0];
}

async function getProcessorById(processorId) {
    const options = {
        where: { id: processorId }
    };
    return _getProcessor(options);
}

async function getProcessorByName(processorName) {
    const options = {
        where: { name: processorName }
    };
    return _getProcessor(options);
}

async function deleteProcessor(processorId) {
    const processorsModel = client.model('processor');
    return processorsModel.destroy({
        where: {
            id: processorId
        }
    });
}

async function updateProcessor(processorId, updatedProcessor) {
    const processorsModel = client.model('processor');
    const { name, description, javascript } = updatedProcessor;
    return processorsModel.update({ name, description, javascript, updated_at: Date.now() }, { where: { id: processorId } });
}

async function initSchemas() {
    const processorsFiles = client.define('processor', {
        id: {
            type: Sequelize.DataTypes.UUID,
            primaryKey: true
        },
        name: {
            type: Sequelize.DataTypes.TEXT('medium')
        },
        description: {
            type: Sequelize.DataTypes.TEXT('long')
        },
        javascript: {
            type: Sequelize.DataTypes.TEXT('long')
        },
        created_at: {
            type: Sequelize.DataTypes.DATE
        },
        updated_at: {
            type: Sequelize.DataTypes.DATE
        }
    });
    await processorsFiles.sync();
}
