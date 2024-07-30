const should = require('should');
const validHeaders = { 'Content-Type': 'application/json' };
const uuid = require('uuid');
const JSCK = require('jsck');
const nock = require('nock');
const { cloneDeep } = require('lodash');
JSCK.Draft4 = JSCK.draft4;
const artilleryCheck = new JSCK.Draft4(require('artillery/core/lib/schemas/artillery_test_script'));
const testsRequestSender = require('./helpers/requestCreator');
const processorsRequestSender = require('../processors/helpers/requestCreator');
const jobsRequestSender = require('../jobs/helpers/requestCreator');

const paymentsOsDsl = require('../../testExamples/paymentsos-dsl');
const fileUrl = 'https://raw.githubusercontent.com/Zooz/predator/master/README.md';
describe('the tests api', function() {
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
        await testsRequestSender.createDslRequests(dslName, paymentsOsDsl.dsl_list);
    });
    beforeEach(function() {
        nock.cleanAll();
    });
    describe('Bad requests tests (create test)', function(){
        it('Should return error for non existing dsl name ', function(){
            const requestBody = require('../../testExamples/Simple_test')('not exist').test;
            return testsRequestSender.createTest(requestBody, validHeaders)
                .then(function(res){
                    res.statusCode.should.eql(400);
                    res.body.should.eql({ message: 'not exist.createToken: dsl name or dsl definition does not exist.' });
                });
        });
        it('Should return error for invalid action name', function(){
            const requestBody = require('../../testExamples/Simple_test')('invalid.invalid').test;
            return testsRequestSender.createTest(requestBody, validHeaders)
                .then(function(res){
                    res.statusCode.should.eql(400);
                    res.body.should.eql({ message: 'action must be this pattern: {dsl_name}.{definition_name}.' });
                });
        });
        it('Should return error for file url not exists ', async () => {
            const requestBody = Object.assign({ processor_file_url: 'https://www.notRealUrl1234.com' }, simpleTest.test);
            const res = await testsRequestSender.createTest(requestBody, validHeaders);
            res.statusCode.should.eql(422);
            res.body.message.should.eql('Error to download file: RequestError: Error: getaddrinfo ENOTFOUND www.notrealurl.com');
        });
        it('Should return error for processor id not exists ', async () => {
            const requestBody = Object.assign({ processor_id: '123e4567-e89b-12d3-a456-426655440000' }, simpleTest.test);
            const res = await testsRequestSender.createTest(requestBody, validHeaders);
            res.statusCode.should.eql(400);
            res.body.message.should.eql('processor with id: 123e4567-e89b-12d3-a456-426655440000 does not exist');
        });
        it('Should return error when using functions not from processor', async () => {
            const processor = {
                name: 'some-user-processor: ' + uuid(),
                description: 'This is a description',
                javascript: 'module.exports.func = 5'
            };
            const processorResponse = await processorsRequestSender.createProcessor(processor, validHeaders);
            processorResponse.statusCode.should.eql(201);
            const processorId = processorResponse.body.id;
            const requestBody = Object.assign({ processor_id: processorId }, testWithFunctions);
            const createTestResponse = await testsRequestSender.createTest(requestBody, validHeaders);
            createTestResponse.statusCode.should.eql(400);
            createTestResponse.body.message.should.eql('Functions: beforeScenario, afterScenario, afterResponse, beforeRequest does not exist in the processor file');
        });

        it('Should return error when using functions without specifying processor id', async () => {
            const requestBody = testWithFunctions;
            const createTestResponse = await testsRequestSender.createTest(requestBody, validHeaders);
            createTestResponse.statusCode.should.eql(400);
            createTestResponse.body.message.should.eql('Functions: beforeScenario, afterScenario, afterResponse, beforeRequest are used without specifying processor');
        });
        const badBodyScenarios = ['Body_with_illegal_artillery', 'Body_with_no_artillery_schema', 'Body_with_no_test_type', 'Body_with_no_description', 'Body_with_no_name', 'Body_with_no_scenarios', 'Body_with_no_step_action',
            'Body_with_no_steps'];

        badBodyScenarios.forEach(function(scenario){
            it('Should return error because ' + scenario, function(){
                const requestBody = require('../../testExamples/' + scenario + '.json');
                const expectedResult = require('../../testResults/' + scenario + '.json');
                return testsRequestSender.createTest(requestBody, validHeaders)
                    .then(function(res){
                        res.body.should.eql(expectedResult);
                        res.statusCode.should.eql(400);
                    });
            });
        });
    });
    describe('create benchmark for test', () => {
        it('Create benchmark with empty body and get 400 response', async () => {
            const requestBody = simpleTest.test;
            const createTestResponse = await testsRequestSender.createTest(requestBody, validHeaders);
            const testId = createTestResponse.body.id;
            const benchmarkResult = await testsRequestSender.createBenchmark(testId, {}, validHeaders);
            const { body } = benchmarkResult;
            should(benchmarkResult.statusCode).eql(400);
            should(body.message).eql('Input validation error');
            should(body.validation_errors).eql(['body should have required property \'errors\'',
                'body should have required property \'codes\'',
                'body should have required property \'rps\'',
                'body should have required property \'latency\'']);
        });
        it('Create benchmark with inner empty body and get 400 response', async () => {
            const requestBody = simpleTest.test;
            const createTestResponse = await testsRequestSender.createTest(requestBody, validHeaders);
            const testId = createTestResponse.body.id;
            const benchmarkResult = await testsRequestSender.createBenchmark(testId, { latency: {}, rps: {} }, validHeaders);
            const { body } = benchmarkResult;
            should(benchmarkResult.statusCode).eql(400);
            should(body.message).eql('Input validation error');
            should(body.validation_errors).eql(['body should have required property \'errors\'',
                'body should have required property \'codes\'',
                'body/rps should have required property \'mean\'',
                'body/rps should have required property \'count\'',
                'body/latency should have required property \'median\'',
                'body/latency should have required property \'p95\'']);
        });
        it('Create benchmark with full body for existing test', async () => {
            const requestBody = simpleTest.test;
            const createTestResponse = await testsRequestSender.createTest(requestBody, validHeaders);
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
            const testId = createTestResponse.body.id;
            const benchmarkResult = await testsRequestSender.createBenchmark(testId, benchmarkRequest, validHeaders);
            const { body } = benchmarkResult;
            should(benchmarkResult.statusCode).eql(201);
            should(body.benchmark_data).eql(benchmarkRequest);
        });
        it('try to create benchmark for not existing test', async () => {
            const benchmarkRequest = {
                rps: {
                    count: 100,
                    mean: 46.74
                },
                latency: { median: 1, p95: 1 },
                errors: {},
                codes: {}
            };
            const benchmarkResult = await testsRequestSender.createBenchmark(uuid(), benchmarkRequest, validHeaders);
            should(benchmarkResult.body.message).eql('Not found');
            should(benchmarkResult.statusCode).eql(404);
        });
        it('try to create benchmark with not valid body and fail', async () => {
            const benchmarkRequest = {
                not_valid: {
                    count: 1270,
                    mean: 46.74
                }
            };
            const benchmarkResult = await testsRequestSender.createBenchmark(uuid(), benchmarkRequest, validHeaders);
            should(benchmarkResult.body.message).eql('Input validation error');
            should(benchmarkResult.statusCode).eql(400);
        });
    });
    describe('get benchmark', () => {
        it('get benchmark', async () => {
            const benchmarkRequest = {
                rps: {
                    count: 100,
                    mean: 46.74
                },
                latency: { median: 1, p95: 1 },
                errors: { errorTest: 1 },
                codes: { codeTest: 1 }
            };
            const requestBody = simpleTest.test;
            const createTestResponse = await testsRequestSender.createTest(requestBody, validHeaders);
            const testId = createTestResponse.body.id;
            const benchmarkResult = await testsRequestSender.createBenchmark(testId, benchmarkRequest, validHeaders);
            should(benchmarkResult.statusCode).eql(201);
            const getResult = await testsRequestSender.getBenchmark(testId, validHeaders);
            should(getResult.statusCode).eql(200);
            should(getResult.body).eql(benchmarkRequest);
        });
        it('get benchmark when no benchmark create to this tests and get 404', async () => {
            const requestBody = simpleTest.test;
            const createTestResponse = await testsRequestSender.createTest(requestBody, validHeaders);
            const testId = createTestResponse.body.id;
            const getResult = await testsRequestSender.getBenchmark(testId, validHeaders);
            should(getResult.statusCode).eql(404);
            should(getResult.body.message).eql('Not found');
        });
        it('get benchmark when tests not created and get 404', async () => {
            const getResult = await testsRequestSender.getBenchmark(uuid(), validHeaders);
            should(getResult.statusCode).eql(404);
            should(getResult.body.message).eql('Not found');
        });
        it('get benchmark with no uuid id and get validation error ', async () => {
            const getResult = await testsRequestSender.getBenchmark(1, validHeaders);
            should(getResult.statusCode).eql(400);
            should(getResult.body.message).eql('Input validation error');
        });
    });
    describe('Good request tests', function() {
        it('Should get 404 for for not existing test', function(){
            return testsRequestSender.getTest(uuid.v4(), validHeaders)
                .then(function(res){
                    res.statusCode.should.eql(404);
                    res.body.should.eql({ message: 'Not found' });
                });
        });
        describe('simple test with dsl', function () {
            it('Create test, update test, delete test, get test', async () => {
                const requestBody = simpleTest.test;
                const createTestResponse = await testsRequestSender.createTest(requestBody, validHeaders);
                createTestResponse.statusCode.should.eql(201, JSON.stringify(createTestResponse.body));
                createTestResponse.body.should.have.only.keys('id', 'revision_id');

                const updatedRequestBody = require('../../testExamples/Test_with_variables')(dslName);
                const updatedTestResponse = await testsRequestSender.updateTest(updatedRequestBody, validHeaders, createTestResponse.body.id);
                updatedTestResponse.statusCode.should.eql(201, JSON.stringify(updatedTestResponse.body));
                updatedTestResponse.body.should.have.only.keys('id', 'revision_id');

                let getTestResponse = await testsRequestSender.getTest(createTestResponse.body.id, validHeaders);
                const expectedResult = require('../../testResults/Test_with_variables')(dslName);
                should(getTestResponse.statusCode).eql(200);
                getTestResponse.body.artillery_test.should.eql(expectedResult);
                getTestResponse.body.should.have.keys('id', 'artillery_test', 'description', 'name', 'revision_id', 'type', 'updated_at');

                const validatedResponse = validate(getTestResponse.body.artillery_test);
                validatedResponse.errors.length.should.eql(0);
                validatedResponse.valid.should.eql(true);

                const deleteTestResponse = await testsRequestSender.deleteTest(validHeaders, createTestResponse.body.id);
                deleteTestResponse.statusCode.should.eql(200);

                getTestResponse = await testsRequestSender.getTest(createTestResponse.body.id, validHeaders);
                getTestResponse.statusCode.should.eql(404);
            });
            it('Create test, with a file', async () => {
                const requestBody = Object.assign({ processor_file_url: fileUrl }, simpleTest.test);
                const createTestResponse = await testsRequestSender.createTest(requestBody, validHeaders);
                console.log('error reponse: ' + JSON.stringify(createTestResponse.body));
                createTestResponse.statusCode.should.eql(201);
                const resGetTest = await testsRequestSender.getTest(createTestResponse.body.id, validHeaders);
                resGetTest.statusCode.should.eql(200);
                should.notEqual(resGetTest.body.file_id, undefined);
                const resGetFile = await testsRequestSender.getFile(resGetTest.body.file_id, validHeaders);
                resGetFile.statusCode.should.eql(200);
            });
            it('Create test, with is_favorite', async () => {
                const requestBody = Object.assign({ is_favorite: true }, simpleTest.test);
                const createTestResponse = await testsRequestSender.createTest(requestBody, validHeaders);
                console.log('error reponse: ' + JSON.stringify(createTestResponse.body));
                createTestResponse.statusCode.should.eql(201);
                const resGetTest = await testsRequestSender.getTest(createTestResponse.body.id, validHeaders);
                resGetTest.statusCode.should.eql(200);
                should.equal(resGetTest.body.is_favorite, true);
                const resGetTests = await testsRequestSender.getTests(validHeaders);
                resGetTests.statusCode.should.eql(200);
                console.log(resGetTests);
                const favTest = resGetTests.body.find(
                    (test) => test.id == createTestResponse.body.id
                );
                should.equal(favTest.is_favorite, true);
            });
            it('Create test, with is_favorite false', async () => {
                const requestBody = Object.assign({ is_favorite: false }, simpleTest.test);
                const createTestResponse = await testsRequestSender.createTest(requestBody, validHeaders);
                console.log('error reponse: ' + JSON.stringify(createTestResponse.body));
                createTestResponse.statusCode.should.eql(201);
                const resGetTest = await testsRequestSender.getTest(createTestResponse.body.id, validHeaders);
                resGetTest.statusCode.should.eql(200);
                should.equal(resGetTest.body.is_favorite, false);
                const resGetTests = await testsRequestSender.getTests(validHeaders);
                resGetTests.statusCode.should.eql(200);
                console.log(resGetTests);
                const favTest = resGetTests.body.find(
                    (test) => test.id == createTestResponse.body.id
                );
                should.equal(favTest.is_favorite, false);
            });
            it('Create test, with a processor id', async () => {
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
                const processorResponse = await processorsRequestSender.createProcessor(processor, validHeaders);
                const processorId = processorResponse.body.id;
                const requestBody = Object.assign({ processor_id: processorId }, testWithFunctions);
                const createTestResponse = await testsRequestSender.createTest(requestBody, validHeaders);
                console.log('error reponse: ' + JSON.stringify(createTestResponse.body));
                createTestResponse.statusCode.should.eql(201);
                const resGetTest = await testsRequestSender.getTest(createTestResponse.body.id, validHeaders);
                resGetTest.statusCode.should.eql(200);
                should.equal(resGetTest.body.processor_id, processorId);
            });
            it('create test with before, and get it', async function () {
                const simpleTestWithBefore = require('../../testExamples/Simple_test_before_feature')(dslName);
                const createTestResponse = await testsRequestSender.createTest(simpleTestWithBefore.test, validHeaders);
                should(createTestResponse.statusCode).eql(201, JSON.stringify(createTestResponse.body));
                createTestResponse.body.should.have.only.keys('id', 'revision_id');
                const expected = require('../../testResults/Simple_test_before_feature')(dslName, createTestResponse.body.id, createTestResponse.body.revision_id);
                const getTestResponse = await testsRequestSender.getTest(createTestResponse.body.id, validHeaders);
                should(getTestResponse.statusCode).eql(200, JSON.stringify(createTestResponse.body));
                should.exists(getTestResponse.body.updated_at);
                delete getTestResponse.body.updated_at;
                should(getTestResponse.body).eql(expected);
            });
            it('Create dsl test, update dsl, get test should return new dsl', async () => {
                const requestBody = simpleTest.test;
                const createTestResponse = await testsRequestSender.createTest(requestBody, validHeaders);
                createTestResponse.statusCode.should.eql(201, JSON.stringify(createTestResponse.body));
                createTestResponse.body.should.have.only.keys('id', 'revision_id');

                const updateTokenRequest = {
                    post: {
                        url: '/tokens',
                        capture: [{
                            json: '$.token',
                            as: 'tokenId'
                        }],
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        json: {
                            token_type: 'credit_card',
                            holder_name: 'new name',
                            expiration_date: '11/2020',
                            card_number: '1234458045804123',
                            identity_document: {
                                number: '1234668464654',
                                type: 'NEW_ID'
                            }
                        }
                    }
                };
                const updateDSLResponse = await testsRequestSender.updateDsl(dslName, 'createToken', updateTokenRequest);
                should(updateDSLResponse.statusCode).eql(200, JSON.stringify(updateDSLResponse.body));

                const getTestResponse = await testsRequestSender.getTest(createTestResponse.body.id, validHeaders);
                should(getTestResponse.statusCode).eql(200);
                const getTestResponseTokenRequest = JSON.parse(getTestResponse.text).artillery_test.scenarios[0].flow[0];
                should(getTestResponseTokenRequest).eql(updateTokenRequest);
            });
        });

        it('Create basic test, update with illegal test, delete test', async () => {
            const requestBody = require('../../testExamples/Basic_test.json');
            const createTestResponse = await testsRequestSender.createTest(requestBody, validHeaders);
            createTestResponse.statusCode.should.eql(201);
            createTestResponse.body.should.have.only.keys('id', 'revision_id');

            const updatedRequestBody = require('../../testExamples/Body_with_illegal_artillery.json');
            const updatedTestResponse = await testsRequestSender.updateTest(updatedRequestBody, validHeaders, createTestResponse.body.id);
            updatedTestResponse.statusCode.should.eql(400);

            let getTestResponse = await testsRequestSender.getTest(createTestResponse.body.id, validHeaders);
            const expectedResult = require('../../testResults/Basic_test.json');
            should(getTestResponse.statusCode).eql(200, JSON.stringify(getTestResponse.body));
            getTestResponse.body.artillery_test.should.eql(expectedResult);

            const deleteTestResponse = await testsRequestSender.deleteTest(validHeaders, createTestResponse.body.id);
            deleteTestResponse.statusCode.should.eql(200);

            getTestResponse = await testsRequestSender.getTest(createTestResponse.body.id, validHeaders);
            getTestResponse.statusCode.should.eql(404);
        });
        it('Create basic test without step url - should add default /', async () => {
            const requestBody = cloneDeep(require('../../testExamples/Basic_test.json'));
            requestBody.artillery_test.scenarios[0].flow[0].post.url = undefined;

            const createTestResponse = await testsRequestSender.createTest(requestBody, validHeaders);
            createTestResponse.statusCode.should.eql(201);
            createTestResponse.body.should.have.only.keys('id', 'revision_id');

            const getTestResponse = await testsRequestSender.getTest(createTestResponse.body.id, validHeaders);
            const expectedResult = cloneDeep(require('../../testResults/Basic_test.json'));
            expectedResult.scenarios[0].flow[0].post.url = '/';
            should(getTestResponse.statusCode).eql(200, JSON.stringify(getTestResponse.body));
            getTestResponse.body.artillery_test.should.eql(expectedResult);
        });
        it('update basic test without step url - should add default /', async () => {
            const requestBody = cloneDeep(require('../../testExamples/Basic_test.json'));

            const createTestResponse = await testsRequestSender.createTest(requestBody, validHeaders);
            createTestResponse.statusCode.should.eql(201);
            createTestResponse.body.should.have.only.keys('id', 'revision_id');

            requestBody.artillery_test.scenarios[0].flow[0].post.url = undefined;

            const updatedTestResponse = await testsRequestSender.updateTest(requestBody, validHeaders, createTestResponse.body.id);
            updatedTestResponse.statusCode.should.eql(201);

            const getTestResponse = await testsRequestSender.getTest(createTestResponse.body.id, validHeaders);
            const expectedResult = cloneDeep(require('../../testResults/Basic_test.json'));
            expectedResult.scenarios[0].flow[0].post.url = '/';
            should(getTestResponse.statusCode).eql(200, JSON.stringify(getTestResponse.body));
            getTestResponse.body.artillery_test.should.eql(expectedResult);
        });

        it('creates two simple tests, get a specific test, and than get list of all tests', async function(){
            const requestBody = require('../../testExamples/Simple_test')(dslName).test;
            const expectedResult = require('../../testResults/Simple_test.json');
            const createTestResponse = await testsRequestSender.createTest(requestBody, validHeaders);
            const createSecondTestResponse = await testsRequestSender.createTest(requestBody, validHeaders);
            createTestResponse.statusCode.should.eql(201, JSON.stringify(createTestResponse.body));
            createSecondTestResponse.statusCode.should.eql(201);
            const getTestResponse = await testsRequestSender.getTest(createTestResponse.body.id, validHeaders);
            const getTestsResponse = await testsRequestSender.getTests(validHeaders);
            let testsIds = [];
            getTestsResponse.body.forEach(test => {
                test.should.have.keys('id', 'description', 'name', 'revision_id', 'type', 'updated_at');
            });
            testsIds = getTestsResponse.body.map(function(test){
                return test.id;
            });
            const validatedResponse = validate(getTestResponse.body.artillery_test);

            validatedResponse.errors.length.should.eql(0);
            validatedResponse.valid.should.eql(true);
            getTestResponse.statusCode.should.eql(200);
            getTestsResponse.statusCode.should.eql(200);
            testsIds.should.containEql(createTestResponse.body.id);
            testsIds.should.containEql(createSecondTestResponse.body.id);
            getTestResponse.body.id.should.eql(createTestResponse.body.id);
            getTestResponse.body.revision_id.should.eql(createTestResponse.body.revision_id);
            getTestResponse.body.artillery_test.should.eql(expectedResult);
        });
        it('create test with several revisions and get all test revisions', async function () {
            const testVer1 = require('../../testExamples/Simple_test')(dslName).test;
            const testVer2 = require('../../testExamples/Simple_test')(dslName).test;
            const getAllRevisionResult = require('../../testResults/getAllRevisionResult')(dslName);
            getAllRevisionResult[0]['is_favorite'] = false;
            getAllRevisionResult[1]['is_favorite'] = false;
            testVer2.scenarios = [testVer2.scenarios[0], testVer2.scenarios[0]];
            const createTestResponse = await testsRequestSender.createTest(testVer1, validHeaders);
            should(createTestResponse.statusCode).eql(201, JSON.stringify(createTestResponse.body));
            const testId = createTestResponse.body.id;
            const createSecondTestResponse = await testsRequestSender.updateTest(testVer2, validHeaders, testId);
            should(createSecondTestResponse.statusCode).eql(201, JSON.stringify(createSecondTestResponse.body));

            const getAllRevisionsResponse = await testsRequestSender.getAllRevisions(testId, validHeaders);
            should(getAllRevisionsResponse.statusCode).eql(200, JSON.stringify(getAllRevisionsResponse.body));
            getAllRevisionsResponse.body.forEach(function (testVer) {
                should.exist(testVer.revision_id);
                should.exist(testVer.updated_at);
                should(testVer.id).eql(testId);
                delete testVer.revision_id;
                delete testVer.id;
                delete testVer.updated_at;
            });
            should(getAllRevisionsResponse.body).eql(getAllRevisionResult);
        });
        it('when get test all revision - should return 404 on non exist test id', async function () {
            const getAllRevisionsResponse = await testsRequestSender.getAllRevisions(uuid.v4(), validHeaders);
            should(getAllRevisionsResponse.statusCode).eql(404);
            should(getAllRevisionsResponse.body).eql({
                message: 'Not found'
            });
        });

        describe('Valid json request for creating tests with illegal body (logically)', function() {
            const invalidLogic = ['Test_with_illegal_too_high_weight',
                'Test_with_illegal_too_low_weight', 'Test_with_several_scenarios_and_weights_sum_up_to_less_than_100',
                'Test_with_several_scenarios_and_weights_sum_up_to_more_than_100'];

            invalidLogic.forEach(function(scenario) {
                it(scenario, function(){
                    const requestBody = require('../../testExamples/' + scenario + '.js')(dslName);
                    const expectedResult = require('../../testResults/' + scenario + '.json');
                    return testsRequestSender.createTest(requestBody, validHeaders)
                        .then(function(res){
                            res.statusCode.should.eql(422, JSON.stringify(res.body));
                            res.body.should.eql(expectedResult);
                        });
                });
            });
        });
    });
    describe('Delete tests', () => {
        it('try to delete test with cron jobs and fail', async () => {
            const requestBody = simpleTest.test;
            const createTestResponse = await testsRequestSender.createTest(requestBody, validHeaders);
            const testId = createTestResponse.body.id;

            let jobsBody = require('../../testExamples/Test_with_jobs.json')['cron-jobs'];
            jobsBody.test_id = testId;
            const createJobResponse = await jobsRequestSender.createJob(jobsBody, validHeaders);
            createJobResponse.statusCode.should.eql(201);

            const deleteTestResponse = await testsRequestSender.deleteTest(validHeaders, testId);
            deleteTestResponse.statusCode.should.eql(409);
        });
    });
});

function validate(script) {
    const validation = artilleryCheck.validate(script);
    return validation;
}
