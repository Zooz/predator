'use strict';
const database = require('./database'),
    uuid = require('uuid'),
    request = require('request-promise-native'),
    { ERROR_MESSAGES } = require('../../common/consts');

module.exports = {
    createFileFromUrl,
    getFile
};
async function createFileFromUrl(testRawData) {
    if (testRawData['file_url']) {
        const fileId = await saveFile(testRawData['file_url']);
        return fileId;
    }
    return undefined;
}
async function downloadFile(fileUrl) {
    const options = {
        url: fileUrl
    };
    try {
        const response = await request.get(options);
        const base64Value = Buffer.from(response).toString('base64');
        return base64Value;
    } catch (err) {
        const errMsg = 'Error to read file, throw exception: ' + err;
        const error = new Error(errMsg);
        error.statusCode = 422;
        throw error;
    }
}

async function getFile(fileId) {
    const file = await database.getFile(fileId);
    if (file) {
        return file;
    } else {
        const error = new Error(ERROR_MESSAGES.NOT_FOUND);
        error.statusCode = 404;
        throw error;
    }
}

async function saveFile(fileUrl) {
    const id = uuid();
    const fileToSave = await downloadFile(fileUrl);
    await database.saveFile(id, fileToSave);
    return id;
}