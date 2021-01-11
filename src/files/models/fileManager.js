'use strict';
const uuid = require('uuid');

const database = require('./database'),
    { ERROR_MESSAGES, CONTEXT_ID } = require('../../common/consts');

module.exports = {
    saveFile,
    getFile
};

async function getFile(fileId, isIncludeContent, context) {
    const contextId = context.get(CONTEXT_ID);

    const file = await database.getFile(fileId, isIncludeContent, contextId);
    if (file) {
        return {
            id: file.id,
            filename: file.name,
            content: file.file
        };
    } else {
        const error = new Error(ERROR_MESSAGES.NOT_FOUND);
        error.statusCode = 404;
        throw error;
    }
}

async function saveFile(fileName, fileContent, context) {
    const contextId = context.get(CONTEXT_ID);

    const id = uuid();
    const fileBase64Value = Buffer.from(fileContent).toString('base64');
    await database.saveFile(id, fileName, fileBase64Value, contextId);
    return id;
}
