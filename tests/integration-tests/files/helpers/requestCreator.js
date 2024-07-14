const request = require('supertest');
const uri = '/v1/files';
const app = require('../../../../src/app');
let testApp;

module.exports = {
    init,
    uploadFile,
    downloadFile,
    getFileMetadata
};

async function init() {
    testApp = await app();
}

function uploadFile(fileKey, filePath, headers = {}) {
    return request(testApp).post(uri)
        .attach(fileKey, filePath)
        .set(headers)
        .expect(function (res) {
            console.log(res.body);
            return res;
        });
}

function downloadFile(id, headers = {}) {
    return request(testApp).get(uri + '/' + id)
        .set(headers)
        .expect(function (res) {
            console.log(res.body);
            return res;
        });
}

function getFileMetadata(id, headers = {}) {
    return request(testApp).get(uri + '/' + id + '/metadata')
        .set(headers)
        .expect(function (res) {
            console.log(res.body);
            return res;
        });
}
