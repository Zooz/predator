'use strict';

const uuid = require('uuid');

const logger = require('../../common/logger'),
    databaseConnector = require('./database/databaseConnector'),
    common = require('../../common/consts.js'),
    fileManager = require('../../tests/models/fileManager.js');

module.exports.createProcessor = async function (processor) {
    let processorId = uuid.v4();
    try {
        if (processor.type === common.PROCESSOR_TYPE_FILE_DOWNLOAD) {
            const file = await fileManager.downloadFile(processor.file_url);
            processor.javascript = file;
        }
        await databaseConnector.insertProcessor(processorId, processor);
        logger.info('Processor saved successfully to database');
        return processor;
    } catch (error) {
        logger.error(error, 'Error occurred trying to create new processor');
        return Promise.reject(error);
    }
};