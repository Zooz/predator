
const database = require('./database'),
    logger = require('../../common/logger'),
    utils = require('../helpers/utils'),
    { ERROR_MESSAGES } = require('../../common/consts');

module.exports = {
    createDefinition,
    updateDefinition,
    getDefinition,
    getDefinitions,
    deleteDefinition
};

async function getDefinitions(dslName) {
    const result = await database.getDslDefinitions(dslName);
    return result.map((definition) => ({
        name: definition.definition_name,
        request: definition.artillery_json
    }));
}

async function getDefinition(dslName, definitionName) {
    const result = await database.getDslDefinition(dslName, definitionName);
    if (result) {
        return {
            name: result.definition_name,
            request: result.artillery_json
        };
    } else {
        const error = new Error(ERROR_MESSAGES.NOT_FOUND);
        error.statusCode = 404;
        throw error;
    }
}

async function createDefinition(dslName, body) {
    utils.addDefaultsToStep(body.request);
    const result = await database.insertDslDefinition(dslName, body.name, body.request);
    if (result){
        logger.info(body, 'Definition created successfully and saved to DB');
        return {
            name: body.name,
            request: body.request
        };
    } else {
        const error = new Error(ERROR_MESSAGES.DSL_DEF_ALREADY_EXIST);
        error.statusCode = 400;
        throw error;
    }
}

async function updateDefinition(dslName, definitionName, body) {
    utils.addDefaultsToStep(body.request);
    const result = await database.updateDslDefinition(dslName, definitionName, body.request);
    if (result){
        logger.info(body, 'Definition updated successfully and saved to DB');
        return {
            name: body.name,
            request: body.request
        };
    } else {
        const error = new Error(ERROR_MESSAGES.NOT_FOUND);
        error.statusCode = 404;
        throw error;
    }
}
async function deleteDefinition(dslName, definitionName, body) {
    const result = await database.deleteDefinition(dslName, definitionName);
    if (result){
        logger.info(body, 'Definition deleted successfully and saved to DB');
    } else {
        const error = new Error(ERROR_MESSAGES.NOT_FOUND);
        error.statusCode = 404;
        throw error;
    }
}
