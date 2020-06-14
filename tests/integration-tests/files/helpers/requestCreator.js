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

function uploadFile(fileKey, filePath) {
    return request(testApp).post(uri)
        .attach(fileKey, filePath)
        .expect(function (res) {
            console.log(res.body);
            return res;
        });
}

function downloadFile(id) {
    return request(testApp).get(uri + '/' + id)
        .expect(function (res) {
            console.log(res.body);
            return res;
        });
}

function getFileMetadata(id) {
    return request(testApp).get(uri + '/' + id + '/metadata')
        .expect(function (res) {
            console.log(res.body);
            return res;
        });
}
