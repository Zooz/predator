
const request = require('supertest'),
    expressApp = require('../../../../src/app');

let app;

module.exports = {
    init,
    createProcessor,
    getProcessors,
    getProcessor
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

function getProcessor(processorId) {
    return request(app).get(`/v1/processors/${processorId}`)
        .set({ 'Content-Type': 'application/json' })
        .expect(function (res) {
            return res;
        });
}