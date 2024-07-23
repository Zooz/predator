const request = require('supertest');
const appInitUtils = require('../../testUtils');
const should = require('should');
let app;
module.exports = {
    init,
    generateUniqueDslName,
    getDsl,
    createDsl,
    updateDsl,
    deleteDsl,
    getDslDefinitions,
    createDslRequests,
    createTest,
    updateTest,
    deleteTest,
    getTests,
    getFile,
    getTest,
    getAllRevisions,
    createBenchmark,
    getBenchmark
};
async function init() {
    try {
        app = await appInitUtils.getCreateTestApp();
    } catch (err){
        console.log(err);
        process.exit(1);
    }
}

function generateUniqueDslName(dslName) {
    return dslName + '_' + new Date().getTime();
}
function getDsl(dslName, definitionName, headers = { 'Content-Type': 'application/json' }) {
    return request(app).get(`/v1/dsl/${dslName}/definitions/${definitionName}`)
        .set(headers)
        .send()
        .expect(function (res) {
            return res;
        });
}
function createDsl(dslName, definitionName, definitionRequest, headers = { 'Content-Type': 'application/json' }) {
    return request(app).post(`/v1/dsl/${dslName}/definitions`)
        .set(headers)
        .send({
            name: definitionName,
            request: definitionRequest
        })
        .expect(function (res) {
            return res;
        });
}
function updateDsl(dslName, definitionName, definitionRequest, headers = { 'Content-Type': 'application/json' }) {
    return request(app).put(`/v1/dsl/${dslName}/definitions/${definitionName}`)
        .set(headers)
        .send({
            request: definitionRequest
        })
        .expect(function (res) {
            return res;
        });
}
function deleteDsl(dslName, definitionName, definitionRequest, headers = { 'Content-Type': 'application/json' }) {
    return request(app).delete(`/v1/dsl/${dslName}/definitions/${definitionName}`)
        .set(headers)
        .send({
            request: definitionRequest
        })
        .expect(function (res) {
            return res;
        });
}
function getDslDefinitions(dslName, headers = { 'Content-Type': 'application/json' }) {
    return request(app).get(`/v1/dsl/${dslName}/definitions`)
        .set(headers)
        .send()
        .expect(function (res) {
            return res;
        });
}

function createTest(body, headers = { 'Content-Type': 'application/json' }) {
    return request(app).post('/v1/tests')
        .send(body)
        .set(headers)
        .expect(function(res){
            return res;
        });
}

function createBenchmark(testId, body, headers = { 'Content-Type': 'application/json' }) {
    return request(app).post('/v1/tests/' + testId + '/benchmark')
        .send(body)
        .set(headers)
        .expect(function (res) {
            return res;
        });
}

function getBenchmark(testId, headers = { 'Content-Type': 'application/json' }) {
    return request(app).get('/v1/tests/' + testId + '/benchmark')
        .set(headers)
        .expect(function (res) {
            return res;
        });
}

function updateTest(body, headers = { 'Content-Type': 'application/json' }, testId) {
    return request(app).put('/v1/tests/' + testId)
        .send(body)
        .set(headers)
        .expect(function(res){
            return res;
        });
}

function deleteTest(headers = { 'Content-Type': 'application/json' }, testId) {
    return request(app).delete('/v1/tests/' + testId)
        .set(headers)
        .expect(function(res){
            return res;
        });
}

function getTest(id, headers = { 'Content-Type': 'application/json' }) {
    return request(app).get('/v1/tests/' + id)
        .set(headers)
        .expect(function(res){
            return res;
        });
}

function getFile(id, headers = { 'Content-Type': 'application/json' }) {
    return request(app).get('/v1/files/' + id)
        .set(headers)
        .expect(function (res) {
            return res;
        });
}
function getAllRevisions(id, headers = { 'Content-Type': 'application/json' }) {
    return request(app).get(`/v1/tests/${id}/revisions`)
        .set(headers)
        .expect(function(res){
            return res;
        });
}

function getTests(headers = { 'Content-Type': 'application/json' }) {
    return request(app).get('/v1/tests')
        .set(headers)
        .expect(function(res){
            return res;
        });
}

async function createDslRequests(dslName, dslRequests, headers = { 'Content-Type': 'application/json' }) {
    return Promise.all(
        dslRequests
            .map(function (dslRequest) {
                return createDsl(dslName, dslRequest.name, dslRequest.request, headers)
                    .then(function (response) {
                        return should(response.statusCode).eql(201, JSON.stringify(response.body));
                    });
            })
    );
}
