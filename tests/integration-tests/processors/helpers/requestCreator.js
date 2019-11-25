
const request = require('supertest'),
    expressApp = require('../../../../src/app');

let app;

module.exports = {
    init,
    createProcessor,
    getProcessors,
    getProcessor,
    deleteProcessor,
    updateProcessor,
    redownloadJSProcessor
};

async function init() {
    try {
        app = await expressApp();
    } catch (err){
        console.log(err);
        process.exit(1);
    }
}

function createProcessor(body, headers) {
    return request(app).post('/v1/processors')
        .send(body)
        .set(headers)
        .expect(function(res){
            return res;
        });
}

function getProcessors(from, limit) {
    return request(app).get('/v1/processors')
        .query({ from, limit })
        .set({ 'Content-Type': 'application/json' })
        .expect(function (res) {
            return res;
        });
}
function deleteProcessor(processorId) {
    return request(app).delete(`/v1/processors/${processorId}`)
        .set({ 'Content-Type': 'application/json' })
        .expect(function (res) {
            return res;
        });
}

function getProcessor(processorId) {
    return request(app).get(`/v1/processors/${processorId}`)
        .set({ 'Content-Type': 'application/json' })
        .expect(function (res) {
            return res;
        });
}

function redownloadJSProcessor(processorId) {
    return request(app).post(`/v1/processors/${processorId}/download`)
        .send({})
        .set({ 'Content-Type': 'application/json' })
        .expect(function(res) {
            return res;
        });
}

function updateProcessor(processorId, processor, dl) {
    return request(app).put(`/v1/processors/${processorId}`)
        .send(processor)
        .query({ dl })
        .set({ 'Content-Type': 'application/json' })
        .expect(function(res) {
            return res;
        });
}
