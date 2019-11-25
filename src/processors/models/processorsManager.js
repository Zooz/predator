'use strict';

const uuid = require('uuid');

const logger = require('../../common/logger'),
    databaseConnector = require('./database/databaseConnector'),
    common = require('../../common/consts.js'),
    fileManager = require('../../tests/models/fileManager.js'),
    { ERROR_MESSAGES, PROCESSOR_TYPE_FILE_DOWNLOAD, PROCESSOR_TYPE_RAW_JAVASCRIPT } = require('../../common/consts');

module.exports.createProcessor = async function (processor) {
    let processorId = uuid.v4();
    try {
        if (processor.type === common.PROCESSOR_TYPE_FILE_DOWNLOAD) {
            processor.javascript = await fileManager.downloadFile(processor.file_url);
        }
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
    const processor = await databaseConnector.getProcessor(processorId);
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

module.exports.redownloadJSProcessor = async function (processorId) {
    const processor = await databaseConnector.getProcessor(processorId);
    let error;
    if (!processor) {
        error = generateProcessorNotFoundError();
        throw error;
    }
    if (!processor.file_url) {
        error = new Error(`option not available for processor with type: ${PROCESSOR_TYPE_RAW_JAVASCRIPT}`);
        error.statusCode = 400;
        throw error;
    }
    try {
        let newJavascriptProcessorContent = await fileManager.downloadFile(processor.file_url);
        fileManager.validateJavascriptContent(newJavascriptProcessorContent);
        processor.javascript = newJavascriptProcessorContent;
        await databaseConnector.updateProcessor(processorId, processor);
        logger.info('Processor javascript updated successfully to database');
        return processor;
    } catch (error) {
        logger.error(error, 'Error occurred trying to re-download processor file');
        return Promise.reject(error);
    }
};

module.exports.updateProcessor = async function (processorId, processor, shouldDownloadFile) {
    const oldProcessor = await databaseConnector.getProcessor(processorId);
    if (!oldProcessor) {
        throw generateProcessorNotFoundError();
    }
    processor.created_at = oldProcessor.created_at;
    if (processor.type === PROCESSOR_TYPE_FILE_DOWNLOAD) {
        if (shouldDownloadFile) {
            let newJavascript = await fileManager.downloadFile(processor.file_url);
            fileManager.validateJavascriptContent(newJavascript);
            processor.javascript = newJavascript;
        } else {
            processor.javascript = oldProcessor.javascript;
        }
    }
    await databaseConnector.updateProcessor(processorId, processor);
    return processor;
};

function generateProcessorNotFoundError() {
    const error = new Error(ERROR_MESSAGES.NOT_FOUND);
    error.statusCode = 404;
    return error;
}
