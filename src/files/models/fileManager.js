'use strict';
const uuid = require('uuid');

const database = require('./database'),
    { ERROR_MESSAGES } = require('../../common/consts');

module.exports = {
    saveFile,
    getFile
};

async function getFile(fileId) {
    const file = await database.getFile(fileId);
    if (file) {
        return {
            id: file.id,
            fileName: file.name,
            fileContent: file.file
        };
    } else {
        const error = new Error(ERROR_MESSAGES.NOT_FOUND);
        error.statusCode = 404;
        throw error;
    }
}

async function saveFile(fileName, fileContent) {
    const id = uuid();
    const fileBase64Value = Buffer.from(fileContent).toString('base64');
    await database.saveFile(id, fileName, fileBase64Value);
    return id;
}
