'use strict';
const request = require('request-promise-native');

module.exports = {
    downloadFile
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
