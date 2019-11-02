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
        const error = new Error(ERROR_MESSAGES.NOT_FOUND);
        error.statusCode = 404;
        throw error;
    }
};
