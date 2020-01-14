'use strict';
const uuid = require('uuid'),
    request = require('request-promise-native');

const database = require('./database'),
    { ERROR_MESSAGES } = require('../../common/consts');

module.exports = {
    saveFile,
    getFile
};

async function downloadFile(fileUrl) {
    const options = {
        url: fileUrl
    };
    try {
        const response = await request.get(options);
        return response;
    } catch (err) {
        const errMsg = 'Error to download file: ' + err;
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
    const fileBase64Value = Buffer.from(fileToSave).toString('base64');
    await database.saveFile(id, fileBase64Value);
    return id;
}
