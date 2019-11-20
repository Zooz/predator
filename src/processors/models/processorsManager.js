'use strict';

const uuid = require('uuid');

const logger = require('../../common/logger'),
    databaseConnector = require('./database/databaseConnector'),
    common = require('../../common/consts.js'),
    fileManager = require('../../tests/models/fileManager.js'),
    { ERROR_MESSAGES } = require('../../common/consts');

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

module.exports.getAllProcessors = async function(from, limit) {
    return databaseConnector.getAllProcessors(from, limit);
};

module.exports.getProcessor = async function(processorId) {
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

module.exports.updateDownloadJSProcessor = async function(processorId) {
    const processor = await databaseConnector.getProcessor(processorId);
    try {
        if (!processor) {
            const error = generateProcessorNotFoundError();
            throw error;
        }
        if (!processor.file_url) {
            throw new Error('option not available for static js content processor');
        }
        let newJavascriptProcessorContent = await fileManager.downloadFile(processor.file_url);
        fileManager.validateJavascriptContent(newJavascriptProcessorContent);
        processor.javascript = newJavascriptProcessorContent;
        await databaseConnector.insertProcessor(processorId, processor);
        logger.info('Processor javascript update successfully to database');
        return processor;
    } catch (error) {
        logger.error(error, 'Error occurred trying to re-download processor file');
        return Promise.reject(error);
    }
};

function generateProcessorNotFoundError() {
    const error = new Error(ERROR_MESSAGES.NOT_FOUND);
    error.statusCode = 404;
    return error;
}
