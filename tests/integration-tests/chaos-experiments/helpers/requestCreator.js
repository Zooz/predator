
const request = require('supertest'),
    expressApp = require('../../../../src/app');

let app;

module.exports = {
    init,
    createChaosExperiment,
    getChaosExperiments,
    getChaosExperiment,
    updateChaosExperiment,
    deleteChaosExperiment
};

async function init() {
    try {
        app = await expressApp();
    } catch (err){
        console.log(err);
        process.exit(1);
    }
}

function createChaosExperiment(body, headers = { 'Content-Type': 'application/json' }) {
    return request(app).post('/v1/chaos-experiments')
        .send(body)
        .set(headers)
        .expect(function(res){
            return res;
        });
}

function getChaosExperiments(from, limit, exclude, headers = { 'Content-Type': 'application/json' }) {
    return request(app).get('/v1/chaos-experiments')
        .query({ from, limit, exclude })
        .set(headers)
        .expect(function (res) {
            return res;
        });
}

function updateChaosExperiment(experimentId, body, headers = { 'Content-Type': 'application/json' }) {
    return request(app).put(`/v1/chaos-experiments/${experimentId}`)
        .send(body)
        .set(headers)
        .expect(function (res) {
            return res;
        });
}

function deleteChaosExperiment(experimentId, headers = { 'Content-Type': 'application/json' }) {
    return request(app).delete(`/v1/chaos-experiments/${experimentId}`)
        .set(headers)
        .expect(function (res) {
            return res;
        });
}

function getChaosExperiment(experimentId, headers = { 'Content-Type': 'application/json' }) {
    return request(app).get(`/v1/chaos-experiments/${experimentId}`)
        .set(headers)
        .expect(function (res) {
            return res;
        });
}
