
const request = require('supertest'),
    expressApp = require('../../../../src/app'),
    should = require('should');
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
    getAllRevisions
};
async function init() {
    try {
        app = await expressApp();
    } catch (err){
        console.log(err);
        process.exit(1);
    }
}

function generateUniqueDslName(dslName) {
    return dslName + '_' + new Date().getTime();
}
function getDsl(dslName, definitionName) {
    return request(app).get(`/v1/dsl/${dslName}/definitions/${definitionName}`)
        .send()
        .expect(function (res) {
            return res;
        });
}
function createDsl(dslName, definitionName, definitionRequest) {
    return request(app).post(`/v1/dsl/${dslName}/definitions`)
        .send({
            name: definitionName,
            request: definitionRequest
        })
        .expect(function (res) {
            return res;
        });
}
function updateDsl(dslName, definitionName, definitionRequest) {
    return request(app).put(`/v1/dsl/${dslName}/definitions/${definitionName}`)
        .send({
            request: definitionRequest
        })
        .expect(function (res) {
            return res;
        });
}
function deleteDsl(dslName, definitionName, definitionRequest) {
    return request(app).delete(`/v1/dsl/${dslName}/definitions/${definitionName}`)
        .send({
            request: definitionRequest
        })
        .expect(function (res) {
            return res;
        });
}
function getDslDefinitions(dslName) {
    return request(app).get(`/v1/dsl/${dslName}/definitions`)
        .send()
        .expect(function (res) {
            return res;
        });
}

function createTest(body, headers) {
    return request(app).post('/v1/tests')
        .send(body)
        .set(headers)
        .expect(function(res){
            return res;
        });
}

function updateTest(body, headers, testId) {
    return request(app).put('/v1/tests/' + testId)
        .send(body)
        .set(headers)
        .expect(function(res){
            return res;
        });
}

function deleteTest(headers, testId) {
    return request(app).delete('/v1/tests/' + testId)
        .set(headers)
        .expect(function(res){
            return res;
        });
}

function getTest(id, headers) {
    return request(app).get('/v1/tests/' + id)
        .set(headers)
        .expect(function(res){
            return res;
        });
}

function getFile(id, headers) {
    return request(app).get('/v1/tests/file/' + id)
        .set(headers)
        .expect(function (res) {
            return res;
        });
}
function getAllRevisions(id, headers) {
    return request(app).get(`/v1/tests/${id}/revisions`)
        .set(headers)
        .expect(function(res){
            return res;
        });
}

function getTests(headers) {
    return request(app).get('/v1/tests')
        .set(headers)
        .expect(function(res){
            return res;
        });
}

async function createDslRequests(dslName, dslRequests) {
    return Promise.all(
        dslRequests
            .map(function (dslRequest) {
                return createDsl(dslName, dslRequest.name, dslRequest.request)
                    .then(function (response) {
                        return should(response.statusCode).eql(201, JSON.stringify(response.body));
                    });
            })
    );
}
