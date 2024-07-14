const request = require('supertest');
const appInitUtils = require('../../testUtils');

let app;

module.exports = {
    init,
    createProcessor,
    getProcessors,
    getProcessor,
    deleteProcessor,
    updateProcessor
};

async function init() {
    try {
        app = await appInitUtils.getCreateTestApp();
    } catch (err){
        console.log(err);
        process.exit(1);
    }
}

function createProcessor(body, headers = { 'Content-Type': 'application/json' }) {
    return request(app).post('/v1/processors')
        .send(body)
        .set(headers)
        .expect(function(res){
            return res;
        });
}

function getProcessors(from, limit, exclude, headers = { 'Content-Type': 'application/json' }) {
    return request(app).get('/v1/processors')
        .query({ from, limit, exclude })
        .set(headers)
        .expect(function (res) {
            return res;
        });
}

function deleteProcessor(processorId, headers = { 'Content-Type': 'application/json' }) {
    return request(app).delete(`/v1/processors/${processorId}`)
        .set(headers)
        .expect(function (res) {
            return res;
        });
}

function getProcessor(processorId, headers = { 'Content-Type': 'application/json' }) {
    return request(app).get(`/v1/processors/${processorId}`)
        .set(headers)
        .expect(function (res) {
            return res;
        });
}

function updateProcessor(processorId, processor, headers = { 'Content-Type': 'application/json' }) {
    return request(app).put(`/v1/processors/${processorId}`)
        .send(processor)
        .set(headers)
        .expect(function(res) {
            return res;
        });
}
