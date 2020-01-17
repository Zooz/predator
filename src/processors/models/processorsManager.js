'use strict';

const uuid = require('uuid');

const logger = require('../../common/logger'),
    databaseConnector = require('./database/databaseConnector'),
    testsManager = require('../../tests/models/manager'),
    JAVASCRIPT = 'javascript',
    { ERROR_MESSAGES } = require('../../common/consts');

module.exports.createProcessor = async function (processor) {
    const processorWithTheSameName = await databaseConnector.getProcessorByName(processor.name);
    if (processorWithTheSameName) {
        throw generateError(ERROR_MESSAGES.PROCESSOR_NAME_ALREADY_EXIST, 400);
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

module.exports.getAllProcessors = async function (from, limit, exclude) {
    let allProcessors = await databaseConnector.getAllProcessors(from, limit);
    if (exclude && (exclude === JAVASCRIPT || exclude.includes(JAVASCRIPT))) {
        allProcessors.forEach(processor => delete processor.javascript);
    }
    return allProcessors;
};

module.exports.getProcessor = async function (processorId) {
    const processor = await databaseConnector.getProcessorById(processorId);
    if (processor) {
        return processor;
    } else {
        const error = generateError(ERROR_MESSAGES.NOT_FOUND, 404);
        throw error;
    }
};

module.exports.deleteProcessor = async function (processorId) {
    const tests = await testsManager.getTestsByProcessorId(processorId);
    if (tests.length > 0) {
        let testNames = tests.map(test => test.name);
        let message = `${ERROR_MESSAGES.PROCESSOR_DELETION_FORBIDDEN}: ${testNames.join(', ')}`;
        throw generateError(message, 409);
    }
    return databaseConnector.deleteProcessor(processorId);
};

module.exports.updateProcessor = async function (processorId, processor) {
    const oldProcessor = await databaseConnector.getProcessorById(processorId);
    if (!oldProcessor) {
        throw generateError(ERROR_MESSAGES.NOT_FOUND, 404);
    }
    if (oldProcessor.name !== processor.name) {
        const processorWithUpdatedName = await databaseConnector.getProcessorByName(processor.name);
        if (processorWithUpdatedName) {
            throw generateError(ERROR_MESSAGES.PROCESSOR_NAME_ALREADY_EXIST, 400);
        }
    }

    processor.created_at = oldProcessor.created_at;
    let exportedFunctions = verifyJSAndGetExportedFunctions(processor.javascript);
    processor.exported_functions = exportedFunctions;
    await databaseConnector.updateProcessor(processorId, processor);
    return processor;
};

function verifyJSAndGetExportedFunctions(src) {
    let exportedFunctions;
    try {
        let m = new module.constructor();
        m.paths = module.paths;
        m._compile(src, 'none');
        let exports = m.exports;
        exportedFunctions = Object.keys(exports);
    } catch (err) {
        let error = generateError('javascript syntax validation failed with error: ' + err.message, 422);
        throw error;
    }

    if (exportedFunctions.length === 0) {
        let error = generateError('javascript has 0 exported functions', 422);
        throw error;
    }
    return exportedFunctions;
}

function generateError(message, statusCode) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}
