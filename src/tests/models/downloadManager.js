'use strict';
const got = require('got');

module.exports = {
    downloadFile
};

async function downloadFile(fileUrl) {
    const options = {
        url: fileUrl
    };
    try {
        const response = await got.get(options);
        return response;
    } catch (err) {
        const errMsg = 'Error to download file: ' + err;
        const error = new Error(errMsg);
        error.statusCode = 422;
        throw error;
    }
}
