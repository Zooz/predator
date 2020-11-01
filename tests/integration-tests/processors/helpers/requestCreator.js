
const request = require('supertest'),
    expressApp = require('../../../../src/app');

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

function getProcessors(from, limit, exclude, headers) {
    return request(app).get('/v1/processors')
        .query({ from, limit, exclude })
        .set(headers)
        .expect(function (res) {
            return res;
        });
}

function deleteProcessor(processorId, headers) {
    return request(app).delete(`/v1/processors/${processorId}`)
        .set(headers)
        .expect(function (res) {
            return res;
        });
}

function getProcessor(processorId, headers) {
    return request(app).get(`/v1/processors/${processorId}`)
        .set(headers)
        .expect(function (res) {
            return res;
        });
}

function updateProcessor(processorId, processor, headers) {
    return request(app).put(`/v1/processors/${processorId}`)
        .send(processor)
        .set(headers)
        .expect(function(res) {
            return res;
        });
}
