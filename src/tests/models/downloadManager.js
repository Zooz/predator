'use strict';
const got = require('got');

module.exports = {
    downloadFile
};

async function downloadFile(fileUrl) {
    const options = {
        url: fileUrl,
        resolveBodyOnly: true
    };
    try {
        return await got.get(options);
    } catch (err) {
        const errMsg = 'Error to download file: ' + err;
        const error = new Error(errMsg);
        error.statusCode = 422;
        throw error;
    }
}
