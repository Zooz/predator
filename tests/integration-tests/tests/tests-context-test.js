const should = require('should');
const JSCK = require('jsck');
const uuid = require('uuid');
const nock = require('nock');
const { cloneDeep } = require('lodash');
JSCK.Draft4 = JSCK.draft4;
const artilleryCheck = new JSCK.Draft4(require('artillery/core/lib/schemas/artillery_test_script'));
const testsRequestSender = require('./helpers/requestCreator');
const processorsRequestSender = require('../processors/helpers/requestCreator');

let contextId = uuid.v4();
const headersWithoutContext = { 'Content-Type': 'application/json' };
const headersWithRandomContext = { 'Content-Type': 'application/json', 'x-context-id': 'random' }
const headersWithContext = { 'x-context-id': contextId, 'Content-Type': 'application/json'}

const paymentsOsDsl = require('../../testExamples/paymentsos-dsl');
const fileUrl = 'https://raw.githubusercontent.com/Zooz/predator/master/README.md';
describe('the tests api with contexts', function() {
    this.timeout(5000000);
    let simpleTest;
    let testWithFunctions;
    let dslName;
    before(async function () {
        await testsRequestSender.init();
        await processorsRequestSender.init();

        dslName = testsRequestSender.generateUniqueDslName('paymentsos');
        simpleTest = require('../../testExamples/Simple_test')(dslName);
        testWithFunctions = require('../../testExamples/Test_with_functions');
        await testsRequestSender.createDslRequests(dslName, paymentsOsDsl.dsl_list, headersWithContext);
    });
    beforeEach(async function() {
        nock.cleanAll();
    });
    describe('benchmarks', () => {
        let testId;

        const benchmarkRequest = {
            rps: {
                count: 1270,
                mean: 46.74
            },
            latency: {
                min: 419.1,
                max: 1295.4,
                median: 553.9,
                p95: 763.8,
                p99: 929.5
            },
            errors: {
                500: 12
            },
            codes: {
                200: 161,
                201: 1061,
                409: 53
            }
        };
        before(async function() {
            const requestBody = simpleTest.test;
            const createTestResponse = await testsRequestSender.createTest(requestBody, headersWithContext);
            testId = createTestResponse.body.id;
        });

        it('Create benchmark with context_id', async () => {
            const benchmarkResult = await testsRequestSender.createBenchmark(testId, benchmarkRequest, headersWithContext);
            const { body } = benchmarkResult;
            should(benchmarkResult.statusCode).eql(201);
            should(body.benchmark_data).eql(benchmarkRequest);
        });

        it('Get benchmark with context_id should return 200', async () => {
            const getResult = await testsRequestSender.getBenchmark(testId, headersWithContext);
            should(getResult.statusCode).eql(200);
            should(getResult.body).eql(benchmarkRequest);
        });

        it('Get benchmark with wrong context_id should return 404', async () => {
            const getResult = await testsRequestSender.getBenchmark(testId, headersWithRandomContext);
            should(getResult.statusCode).eql(404);
        });

        it('Get benchmark without context_id should return 200', async () => {
            const getResult = await testsRequestSender.getBenchmark(testId, headersWithoutContext);
            should(getResult.statusCode).eql(200);
            should(getResult.body).eql(benchmarkRequest);
        });
    });
    describe('tests', function() {
        let createTestWithContextResponse, createTestWithoutContextResponse;

        // create tests
        it('Create test with context_id', async () => {
            const requestBody = cloneDeep(require('../../testExamples/Basic_test.json'));
            requestBody.artillery_test.scenarios[0].flow[0].post.url = undefined;

            createTestWithContextResponse = await testsRequestSender.createTest(requestBody, headersWithContext);
            createTestWithContextResponse.statusCode.should.eql(201);
        });

        it('Create test without context_id', async () => {
            const requestBody = cloneDeep(require('../../testExamples/Basic_test.json'));
            requestBody.artillery_test.scenarios[0].flow[0].post.url = undefined;

            createTestWithoutContextResponse = await testsRequestSender.createTest(requestBody, headersWithoutContext);
            createTestWithoutContextResponse.statusCode.should.eql(201);
        });

        // get test
        it('Get test with context_id should return 200', async () => {
            const getTestResponse = await testsRequestSender.getTest(createTestWithContextResponse.body.id, headersWithContext);
            should(getTestResponse.statusCode).eql(200);
        });

        it('Get test with wrong context_id should return 404', async () => {
            const getTestResponse = await testsRequestSender.getTest(createTestWithContextResponse.body.id, headersWithRandomContext);
            should(getTestResponse.statusCode).eql(404);
        });

        it('Get test without context_id should return 200', async () => {
            const getTestResponse = await testsRequestSender.getTest(createTestWithContextResponse.body.id, headersWithoutContext);
            should(getTestResponse.statusCode).eql(200);
        });

        it('Get test created without context with context-id-header should return 404', async () => {
            const getTestResponse = await testsRequestSender.getTest(createTestWithoutContextResponse.body.id, headersWithContext);
            should(getTestResponse.statusCode).eql(404);
        });

        // get tests
        it('Get tests without context_id should return 200 with both tests', async () => {
            const getTestResponse = await testsRequestSender.getTests(headersWithoutContext);
            should(getTestResponse.statusCode).eql(200);
            const firstTest = getTestResponse.body.find((test) => test.id === createTestWithContextResponse.body.id)
            const secondTest = getTestResponse.body.find((test) => test.id === createTestWithoutContextResponse.body.id)
            should(firstTest).not.be.undefined();
            should(secondTest).not.be.undefined();
        });

        it('Get tests with wrong context_id should return 200 with 0 tests', async () => {
            const getTestResponse = await testsRequestSender.getTests(headersWithRandomContext);
            should(getTestResponse.statusCode).eql(200);
            should(getTestResponse.body.length).eql(0);
        });

        it('Get tests with context_id should return 200 with tests', async () => {
            const getTestResponse = await testsRequestSender.getTests(headersWithContext);
            should(getTestResponse.statusCode).eql(200);
            should(getTestResponse.body.length).greaterThan(0);
        });

        // update tests
        it('Update test created with context_id with context_id header should return 201', async () => {
            const updatedName = `updated-name-${uuid.v4()}`;
            let getTestResponse = await testsRequestSender.getTest(createTestWithContextResponse.body.id, headersWithContext);
            getTestResponse.body.name = updatedName;

            const updateTestResponse = await testsRequestSender.updateTest(getTestResponse.body, headersWithContext, createTestWithContextResponse.body.id);
            should(updateTestResponse.statusCode).eql(201);

            getTestResponse = await testsRequestSender.getTest(createTestWithContextResponse.body.id, headersWithContext);
            should(getTestResponse.body.name).eql(updatedName);
        });

        it('Update test created with context_id with wrong context_id header should return 404', async () => {
            const updatedName = `updated-name-${uuid.v4()}`;
            let getTestResponse = await testsRequestSender.getTest(createTestWithContextResponse.body.id, headersWithContext);
            getTestResponse.body.name = updatedName;

            const updateTestResponse = await testsRequestSender.updateTest(getTestResponse.body, headersWithRandomContext, createTestWithContextResponse.body.id);
            should(updateTestResponse.statusCode).eql(404);
        });

        it('Update test created with context_id without context_id header should return 201', async () => {
            const updatedName = `updated-name-${uuid.v4()}`;
            let getTestResponse = await testsRequestSender.getTest(createTestWithContextResponse.body.id, headersWithoutContext);
            getTestResponse.body.name = updatedName;

            const updateTestResponse = await testsRequestSender.updateTest(getTestResponse.body, headersWithoutContext, createTestWithContextResponse.body.id);
            should(updateTestResponse.statusCode).eql(201);

            getTestResponse = await testsRequestSender.getTest(createTestWithContextResponse.body.id, headersWithoutContext);
            should(getTestResponse.body.name).eql(updatedName);
        });

        // delete tests
        it('Delete test created with context_id with wrong context_id header should return 404', async () => {
            const deletedTestResponse = await testsRequestSender.deleteTest(headersWithRandomContext, createTestWithContextResponse.body.id);
            should(deletedTestResponse.statusCode).eql(404);

            const getTestResponse = await testsRequestSender.getTest(createTestWithContextResponse.body.id, headersWithoutContext);
            should(getTestResponse.statusCode).eql(200);
        });

        it('Delete test created with context_id with context_id header should return 200', async () => {
            const deletedTestResponse = await testsRequestSender.deleteTest(headersWithContext, createTestWithContextResponse.body.id);
            should(deletedTestResponse.statusCode).eql(200);

            const getTestResponse = await testsRequestSender.getTest(createTestWithContextResponse.body.id, headersWithoutContext);
            should(getTestResponse.statusCode).eql(404);
        });

        it('Delete test without context_id header should return 204', async () => {
            const deletedTestResponse = await testsRequestSender.deleteTest(headersWithoutContext, createTestWithoutContextResponse.body.id);
            should(deletedTestResponse.statusCode).eql(200);

            const getTestResponse = await testsRequestSender.getTest(createTestWithoutContextResponse.body.id, headersWithoutContext);
            should(getTestResponse.statusCode).eql(404);
        });

        describe('complex tests', function () {
            describe('dsl', async function() {
                it('create test with dsl that was created with context should return 201', async function(){
                    const requestBody = simpleTest.test;
                    const createTestResponse = await testsRequestSender.createTest(requestBody, headersWithContext);
                    createTestResponse.statusCode.should.eql(201);
                });
                it('create test sending wrong context-id header with dsl that was created with context should return 400', async function(){
                    const requestBody = simpleTest.test;
                    const createTestResponse = await testsRequestSender.createTest(requestBody, headersWithRandomContext);
                    createTestResponse.statusCode.should.eql(400);
                });
                it('create test without sending context-id header with dsl that was created with context should return 201', async function(){
                    const requestBody = simpleTest.test;
                    const createTestResponse = await testsRequestSender.createTest(requestBody, headersWithoutContext);
                    createTestResponse.statusCode.should.eql(201);
                });
            });
            describe('files', async function() {
                it('Create test, with a file', async () => {
                    const requestBody = Object.assign({ processor_file_url: fileUrl }, simpleTest.test);
                    const createTestResponse = await testsRequestSender.createTest(requestBody, headersWithContext);
                    console.log('error response: ' + JSON.stringify(createTestResponse.body));
                    createTestResponse.statusCode.should.eql(201);
                    const resGetTest = await testsRequestSender.getTest(createTestResponse.body.id, headersWithContext);
                    resGetTest.statusCode.should.eql(200);
                    should.notEqual(resGetTest.body.file_id, undefined);
                    const resGetFile = await testsRequestSender.getFile(resGetTest.body.file_id, headersWithContext);
                    resGetFile.statusCode.should.eql(200);
                });
            });
            describe('processors', async function() {
                it('create test with processor', async function(){
                    const processor = {
                        name: 'some-user-processor: ' + uuid(),
                        description: 'This is a description',
                        javascript: 'module.exports = {\n' +
                            '    beforeRequest,\n' +
                            '    afterResponse,\n' +
                            '    afterScenario,\n' +
                            '    beforeScenario\n' +
                            '};\n' +
                            'function beforeRequest(requestParams, context, ee, next) {\n' +
                            '    return next(); // MUST be called for the scenario to continue\n' +
                            '}\n' +
                            'function afterResponse(requestParams, response, context, ee, next) {\n' +
                            '    return next(); // MUST be called for the scenario to continue\n' +
                            '}\n' +
                            'function afterScenario(context, ee, next) {\n' +
                            '    return next(); // MUST be called for the scenario to continue\n' +
                            '}\n' +
                            'function beforeScenario(context, ee, next) {\n' +
                            '    return next(); // MUST be called for the scenario to continue\n' +
                            '}'
                    };
                    const processorResponse = await processorsRequestSender.createProcessor(processor, headersWithContext);
                    const processorId = processorResponse.body.id;
                    const requestBody = Object.assign({ processor_id: processorId }, testWithFunctions);
                    const createTestResponse = await testsRequestSender.createTest(requestBody, headersWithContext);
                    console.log('error reponse: ' + JSON.stringify(createTestResponse.body));
                    createTestResponse.statusCode.should.eql(201);
                    const resGetTest = await testsRequestSender.getTest(createTestResponse.body.id, headersWithContext);
                    resGetTest.statusCode.should.eql(200);
                    should.equal(resGetTest.body.processor_id, processorId);
                });
            });
        });
    });
});

function validate(script) {
    const validation = artilleryCheck.validate(script);
    return validation;
}
