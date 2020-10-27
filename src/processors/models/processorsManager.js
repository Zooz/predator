'use strict';

const httpContext = require('express-http-context'),
    uuid = require('uuid');

const logger = require('../../common/logger'),
    databaseConnector = require('./database/databaseConnector'),
    testsManager = require('../../tests/models/manager'),
    { ERROR_MESSAGES, CONTEXT_ID } = require('../../common/consts'),
    generateError = require('../../common/generateError');

module.exports.createProcessor = async function (processor) {
    const contextId = httpContext.get(CONTEXT_ID);

    const processorWithTheSameName = await databaseConnector.getProcessorByName(processor.name, contextId);
    if (processorWithTheSameName) {
        throw generateError(400, ERROR_MESSAGES.PROCESSOR_NAME_ALREADY_EXIST);
    }
    const processorId = uuid.v4();
    try {
        const exportedFunctions = verifyJSAndGetExportedFunctions(processor.javascript);
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

module.exports.getAllProcessors = async function (from, limit, exclude) {
    const contextId = httpContext.get(CONTEXT_ID);

    const allProcessors = await databaseConnector.getAllProcessors(from, limit, exclude, contextId);
    return allProcessors;
};

module.exports.getProcessor = async function (processorId) {
    const contextId = httpContext.get(CONTEXT_ID);

    const processor = await databaseConnector.getProcessorById(processorId, contextId);
    if (processor) {
        return processor;
    } else {
        const error = generateError(404, ERROR_MESSAGES.NOT_FOUND);
        throw error;
    }
};

module.exports.deleteProcessor = async function (processorId) {
    const contextId = httpContext.get(CONTEXT_ID);

    const tests = await testsManager.getTestsByProcessorId(processorId);
    if (tests.length > 0) {
        const testNames = tests.map(test => test.name);
        const message = `${ERROR_MESSAGES.PROCESSOR_DELETION_FORBIDDEN}: ${testNames.join(', ')}`;
        throw generateError(409, message);
    }
    return databaseConnector.deleteProcessor(processorId, contextId);
};

module.exports.updateProcessor = async function (processorId, processor) {
    const contextId = httpContext.get(CONTEXT_ID);

    const oldProcessor = await databaseConnector.getProcessorById(processorId, contextId);
    if (!oldProcessor) {
        throw generateError(404, ERROR_MESSAGES.NOT_FOUND);
    }
    if (oldProcessor.name !== processor.name) {
        const processorWithUpdatedName = await databaseConnector.getProcessorByName(processor.name);
        if (processorWithUpdatedName) {
            throw generateError(400, ERROR_MESSAGES.PROCESSOR_NAME_ALREADY_EXIST);
        }
    }

    processor.created_at = oldProcessor.created_at;
    const exportedFunctions = verifyJSAndGetExportedFunctions(processor.javascript);
    processor.exported_functions = exportedFunctions;
    await databaseConnector.updateProcessor(processorId, processor);
    return processor;
};

function verifyJSAndGetExportedFunctions(src) {
    let exportedFunctions;
    try {
        const m = new module.constructor();
        m.paths = module.paths;
        m._compile(src, 'none');
        const exports = m.exports;
        exportedFunctions = Object.keys(exports);
    } catch (err) {
        const error = generateError(422, 'javascript syntax validation failed with error: ' + err.message);
        throw error;
    }

    if (exportedFunctions.length === 0) {
        const error = generateError(422, 'javascript has 0 exported functions');
        throw error;
    }
    return exportedFunctions;
}
