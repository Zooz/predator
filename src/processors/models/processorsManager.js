'use strict';

const uuid = require('uuid');

const logger = require('../../common/logger'),
    databaseConnector = require('./database/databaseConnector'),
    { ERROR_MESSAGES } = require('../../common/consts');

module.exports.createProcessor = async function (processor) {
    const processorWithTheSameName = await databaseConnector.getProcessorByName(processor.name);
    if (processorWithTheSameName) {
        throw generateProcessorNameAlreadyExistsError();
    }
    let processorId = uuid.v4();
    try {
        let exportedFunctions = verifyJSAndGetExportedFunctions(processor.javascript);
        processor.exported_functions = exportedFunctions;
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
    let allProcessors = await databaseConnector.getAllProcessors(from, limit);
    allProcessors.forEach(processor => {
    });
    return allProcessors;
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
    let exportedFunctions = verifyJSAndGetExportedFunctions(processor.javascript);
    processor.exported_functions = exportedFunctions;
    await databaseConnector.updateProcessor(processorId, processor);
    processor.exported_functions = verifyJSAndGetExportedFunctions(processor.javascript, true);
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

function generateUnprocessableEntityError(message) {
    const error = new Error(message);
    error.statusCode = 422;
    return error;
}
function verifyJSAndGetExportedFunctions(src) {
    let exportedFunctions;
    try {
        let m = new module.constructor();
        m.paths = module.paths;
        m._compile(src, 'none');
        let exports = m.exports;
        exportedFunctions = Object.keys(exports);
    } catch (err) {
        let error = generateUnprocessableEntityError('javascript syntax validation failed with error: ' + err.message);
        throw error;
    }

    if (exportedFunctions.length === 0) {
        let error = generateUnprocessableEntityError('javascript has 0 exported function');
        throw error;
    }
    return exportedFunctions;
}
