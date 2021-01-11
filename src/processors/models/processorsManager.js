'use strict';
 const uuid = require('uuid');

const logger = require('../../common/logger');
const databaseConnector = require('./database/databaseConnector'),
     testsManager = require('../../tests/models/manager'),
    { ERROR_MESSAGES, CONTEXT_ID } = require('../../common/consts'),
    generateError = require('../../common/generateError');

module.exports.createProcessor = async function (processor, context, log) {
    const contextId = context.get(CONTEXT_ID);

    const processorWithTheSameName = await databaseConnector.getProcessorByName(processor.name, contextId);
    if (processorWithTheSameName) {
        throw generateError(400, ERROR_MESSAGES.PROCESSOR_NAME_ALREADY_EXIST);
    }
    const processorId = uuid.v4();
    try {
        processor.exported_functions = verifyJSAndGetExportedFunctions(processor.javascript);
        await databaseConnector.insertProcessor(processorId, processor, contextId);
        processor.id = processorId;
        logger.info('Processor saved successfully to database');
        return processor;
    } catch (error) {
        logger.error(error, 'Error occurred trying to create new processor');
        return Promise.reject(error);
    }
};

module.exports.getAllProcessors = async function (from, limit, exclude, context) {
    const contextId = context.get(CONTEXT_ID);

    return await databaseConnector.getAllProcessors(from, limit, exclude, contextId);
};

module.exports.getProcessor = async function (processorId, context) {
    const contextId = context.get(CONTEXT_ID);

    const processor = await databaseConnector.getProcessorById(processorId, contextId);
    if (processor) {
        return processor;
    } else {
        throw generateError(404, ERROR_MESSAGES.NOT_FOUND);
    }
};

module.exports.deleteProcessor = async function (processorId, context) {
    const contextId = context.get(CONTEXT_ID);

    const processor = await databaseConnector.getProcessorById(processorId, contextId);
    if (!processor) {
        throw generateError(404, ERROR_MESSAGES.NOT_FOUND);
    }

    const tests = await testsManager.getTestsByProcessorId(processorId);
    if (tests.length > 0) {
        const testNames = tests.map(test => test.name);
        const message = `${ERROR_MESSAGES.PROCESSOR_DELETION_FORBIDDEN}: ${testNames.join(', ')}`;
        throw generateError(409, message);
    }
    return databaseConnector.deleteProcessor(processorId);
};

module.exports.updateProcessor = async function (processorId, processor, context) {
    const contextId = context.get(CONTEXT_ID);

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
    processor.exported_functions = verifyJSAndGetExportedFunctions(processor.javascript);
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
        throw generateError(422, 'javascript syntax validation failed with error: ' + err.message);
    }

    if (exportedFunctions.length === 0) {
        throw generateError(422, 'javascript has 0 exported functions');
    }
    return exportedFunctions;
}
