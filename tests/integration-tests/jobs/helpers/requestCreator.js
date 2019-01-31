let request = require('supertest');
let app = require('../../../../src/app');
let testApp;
module.exports = {
    init,
    deleteJobFromScheduler,
    createJob,
    updateJob,
    getJob,
    getJobs,
    stopRun

};

async function init() {
    testApp = await app();
}

function deleteJobFromScheduler(jobId) {
    return request(testApp).delete('/v1/jobs/' + jobId)
        .send()
        .set({ 'Content-Type': 'application/json' });
}

function createJob(body, headers) {
    return request(testApp).post('/v1/jobs')
        .send(body)
        .set(headers)
        .expect(function (res) {
            console.log(res.body);
            return res;
        });
}

function updateJob(jobId, body, headers) {
    return request(testApp).put('/v1/jobs/' + jobId)
        .send(body)
        .set(headers)
        .expect(function (res) {
            console.log(res.body);
            return res;
        });
}

function getJob(jobId, headers) {
    return request(testApp).get('/v1/jobs/' + jobId)
        .set(headers)
        .expect(function (res) {
            console.log(res.body);
            return res;
        });
}

function getJobs(headers, oneTime) {
    let url = '/v1/jobs';
    if (oneTime) {
        url += '?one_time=true';
    }
    return request(testApp).get(url)
        .set(headers)
        .expect(function (res) {
            console.log(res.body);
            return res;
        });
}

function stopRun(jobId, runId, headers) {
    return request(testApp).post(`/v1/jobs/${jobId}/runs/${runId}/stop`)
        .set(headers)
        .expect(function (res) {
            return res;
        });
}