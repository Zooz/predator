'use strict';
const uuid = require('uuid');

const database = require('./database/sequelize/sequelizeConnector'),
    { ERROR_MESSAGES } = require('../../common/consts');

module.exports = {
    getContexts,
    saveContext,
    deleteContext
};

async function getContexts() {
    const contexts = await database.getContexts();
    if (contexts) {
        return contexts.map(({ dataValues }) => ({
            id: dataValues.id,
            name: dataValues.name
        }));
    } else {
        const error = new Error(ERROR_MESSAGES.NOT_FOUND);
        error.statusCode = 404;
        throw error;
    }
}

async function saveContext(contextName) {
    const id = uuid();
    try {
        await database.saveContext(id, contextName);
    } catch (err) {
        const error = new Error(err.message);
        error.statusCode = 400;
        throw error;
    }
    return id;
}

async function deleteContext(contextId) {
    let deleteResult;
    try {
        deleteResult = await database.deleteContext(contextId);
    } catch (err) {
        const error = new Error(err.message);
        error.statusCode = 400;
        throw error;
    }

    return deleteResult;
}
