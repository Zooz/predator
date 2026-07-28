'use strict';
module.exports = {
    downloadFile
};

async function downloadFile(fileUrl) {
    try {
        const response = await fetch(fileUrl);
        if (!response.ok) {
            throw new Error(`${response.status} ${response.statusText}`);
        }
        return await response.text();
    } catch (err) {
        const errMsg = 'Error to download file: ' + err;
        const error = new Error(errMsg);
        error.statusCode = 422;
        throw error;
    }
}
