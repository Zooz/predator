
const request = require('supertest');
const expressApp = require('../../../../src/app');

let app;
const headers = { 'Content-Type': 'application/json' };
const resourceUri = '/v1/contexts';

module.exports = {
    init,
    createContext,
    getContexts,
    deleteContext
};

async function init() {
    try {
        app = await expressApp();
    } catch (err){
        console.log(err);
        process.exit(1);
    }
}

function createContext(body) {
    return request(app)
        .post(resourceUri)
        .send(body)
        .set(headers)
        .expect(function(res){
            return res;
        });
}

function getContexts() {
    return request(app)
        .get(resourceUri)
        .set(headers)
        .expect(function (res) {
            return res;
        });
}

function deleteContext(body) {
    return request(app)
        .delete(resourceUri)
        .send(body)
        .set(headers)
        .expect(function (res) {
            return res;
        });
}