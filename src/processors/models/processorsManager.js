'use strict';

const uuid = require('uuid');

const logger = require('../../common/logger'),
    databaseConnector = require('./database/databaseConnector'),
    fileManager = require('../../tests/models/fileManager.js'),
    { ERROR_MESSAGES } = require('../../common/consts');

module.exports.createProcessor = async function (processor) {
    let processorId = uuid.v4();
    const processorWithTheSameName = await databaseConnector.getProcessorByName(processor.name);
    if (processorWithTheSameName) {
        throw generateProcessorNameAlreadyExistsError();
    }
    try {
        fileManager.validateJavascriptContent(processor.javascript);
        await databaseConnector.insertProcessor(processorId, processor);
        processor.id = processorId;
        logger.info('Processor saved successfully to database');
        return processor;
    } catch (error) {
        logger.error(error, 'Error occurred trying to create new processor');
        return Promise.reject(error);
    }
};

module.exports.getAllProcessors = async function (from, limit) {
    return databaseConnector.getAllProcessors(from, limit);
};

module.exports.getProcessor = async function (processorId) {
    const processor = await databaseConnector.getProcessorById(processorId);
    if (processor) {
        return processor;
    } else {
        const error = generateProcessorNotFoundError();
        throw error;
    }
};

module.exports.deleteProcessor = async function (processorId) {
    return databaseConnector.deleteProcessor(processorId);
};

module.exports.updateProcessor = async function (processorId, processor) {
    const oldProcessor = await databaseConnector.getProcessorById(processorId);
    if (!oldProcessor) {
        throw generateProcessorNotFoundError();
    }
    if (oldProcessor.name !== processor.name) {
        const processorWithUpdatedName = await databaseConnector.getProcessorByName(processor.name);
        if (processorWithUpdatedName) {
            throw generateProcessorNameAlreadyExistsError();
        }
    }

    processor.created_at = oldProcessor.created_at;
    fileManager.validateJavascriptContent(processor.javascript);
    await databaseConnector.updateProcessor(processorId, processor);
    return processor;
};

function generateProcessorNotFoundError() {
    const error = new Error(ERROR_MESSAGES.NOT_FOUND);
    error.statusCode = 404;
    return error;
}

function generateProcessorNameAlreadyExistsError() {
    const error = new Error(ERROR_MESSAGES.PROCESSOR_NAME_ALREADY_EXIST);
    error.statusCode = 400;
    return error;
}
