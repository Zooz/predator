const request = require('supertest');
const appInitUtils = require('../../testUtils');

let testApp;
module.exports = {
    init,
    deletePredatorRunnerContainers,
    deleteJobFromScheduler,
    createJob,
    updateJob,
    getJob,
    getJobs,
    stopRun,
    getLogs

};

async function init() {
    testApp = await appInitUtils.getCreateTestApp();
}

function deletePredatorRunnerContainers() {
    return request(testApp).delete('/v1/jobs/runs/containers')
        .send()
        .set({ 'Content-Type': 'application/json' });
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

function stopRun(jobId, reportId, headers) {
    return request(testApp).post(`/v1/jobs/${jobId}/runs/${reportId}/stop`)
        .set(headers)
        .expect(function (res) {
            return res;
        });
}

function getLogs(jobId, reportId, headers) {
    return request(testApp).get(`/v1/jobs/${jobId}/runs/${reportId}/logs`)
        .set(headers)
        .expect(function (res) {
            return res;
        });
}
