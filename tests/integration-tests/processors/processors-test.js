const should = require('should'),
    uuid = require('uuid/v4');

let validHeaders = { 'Content-Type': 'application/json' };
const processorRequestSender = require('./helpers/requestCreator');
const testsRequestSender = require('../tests/helpers/requestCreator');
const { ERROR_MESSAGES } = require('../../../src/common/consts');
const basicTest = require('../../testExamples/Basic_test.json');
describe('Processors api', function() {
    this.timeout(5000000);
    before(async function () {
        await processorRequestSender.init();
        await testsRequestSender.init();
    });

    describe('Good requests', async function() {
        describe('GET /v1/processors', function () {
            let numberOfProcessorsToInsert = 101;
            let jsProcessorsArr = [];
            let processorsInserted = [];
            before(async function() {
                for (let i = 0; i < numberOfProcessorsToInsert; i++) {
                    const processor = generateRawJSProcessor(i.toString());
                    jsProcessorsArr.push(processor);
                    const processorRes = await processorRequestSender.createProcessor(processor, validHeaders);
                    processorsInserted.push(processorRes);
                }
            });
            it('Check default paging values (from = 0, limit = 100)', async function() {
                let getProcessorsResponse = await processorRequestSender.getProcessors();

                should(getProcessorsResponse.statusCode).equal(200);

                const processors = getProcessorsResponse.body;
                should(processors.length).equal(100);
            });

            it('Get a page', async function() {
                const from = 25, limit = 50;
                let getProcessorsResponse = await processorRequestSender.getProcessors(from, limit);

                should(getProcessorsResponse.statusCode).equal(200);

                const processors = getProcessorsResponse.body;
                should(processors.length).equal(limit);
            });

            it('Validate from parameter starts from the correct index', async function() {
                const from = 0, limit = 50;
                let page1Response = await processorRequestSender.getProcessors(from, limit);
                let page2Response = await processorRequestSender.getProcessors(from + 1, limit);

                should(page1Response.statusCode).equal(200);
                should(page2Response.statusCode).equal(200);

                const page1Processors = page1Response.body;
                const page2Processors = page2Response.body;
                should(page1Processors[1]).deepEqual(page2Processors[0]);
            });

            it('Get a page with limit > # of processors', async function() {
                const from = 0, limit = 1000;
                let getProcessorsResponse = await processorRequestSender.getProcessors(from, limit);

                should(getProcessorsResponse.statusCode).equal(200);

                const processors = getProcessorsResponse.body;
                should(processors.length).greaterThanOrEqual(101);
            });

            it('Get tests without javascript field', async function() {
                const from = 0, limit = 10;
                let getProcessorsResponse = await processorRequestSender.getProcessors(from, limit, 'javascript');

                should(getProcessorsResponse.statusCode).equal(200);

                const processors = getProcessorsResponse.body;
                const processorsWithJavascript = processors.filter(processor => processor.javascript);
                should(processorsWithJavascript).equal(0);
            });
            after(async function() {
                const processorIds = processorsInserted.map(processor => processor.body.id);
                processorIds.forEach(async (processorId) => {
                    await processorRequestSender.deleteProcessor(processorId);
                });
            });
        });
        describe('DELETE /v1/processors/{processor_id}', () => {
            it('insert a processor and then delete it', async () => {
                const processor = generateRawJSProcessor('some_id');
                const insertResponse = await processorRequestSender.createProcessor(processor, validHeaders);

                should(insertResponse.statusCode).equal(201);
                const processorId = insertResponse.body.id;

                const deleteResponse = await processorRequestSender.deleteProcessor(processorId);
                should(deleteResponse.statusCode).equal(204);

                const getProcessorResponse = await processorRequestSender.getProcessor(processorId);
                should(getProcessorResponse.statusCode).equal(404);
            });

            it('delete a processor that doesn\'t exist - expect status code 204', async () => {
                const processorId = uuid();
                // making sure that there is no processor with the generated uuid (not taking any chances :) )
                await processorRequestSender.deleteProcessor(processorId);
                const deleteResponse = await processorRequestSender.deleteProcessor(processorId);
                should(deleteResponse.statusCode).equal(204);
            });
        });
        describe('GET /v1/processors/{processor_id}', function () {
            let processorData, processor;
            before(async function() {
                processorData = generateRawJSProcessor('mickeys-processor');
                const processorResponse = await processorRequestSender.createProcessor(processorData, validHeaders);
                processor = processorResponse.body;
            });
            it('Get processor by id', async () => {
                let getProcessorResponse = await processorRequestSender.getProcessor(processor.id, validHeaders);
                getProcessorResponse.statusCode.should.eql(200);
                should(getProcessorResponse.body).containDeep(processorData);
                should(getProcessorResponse.body.exported_functions).eql(['simple']);
            });
            it('Get non-existent processor by id', async () => {
                let getProcessorResponse = await processorRequestSender.getProcessor(uuid(), validHeaders);
                getProcessorResponse.statusCode.should.eql(404);
            });
            after(async function() {
                const deleteResponse = await processorRequestSender.deleteProcessor(processor.id);
                should(deleteResponse.statusCode).equal(204);
            });
        });
        describe('POST /v1/processors', function () {
            it('Create processor', async () => {
                const requestBody = {
                    name: 'authentication',
                    description: 'Creates authorization token and saves it in the context',
                    javascript:
                        `{
                        const uuid = require('uuid/v4');
                        module.exports = {
                        createAuthToken
                        };

                        function createAuthToken(userContext, events, done) {
                        userContext.vars.token = uuid();
                        return done();
                        }
                    }`
                };
                let createProcessorResponse = await processorRequestSender.createProcessor(requestBody, validHeaders);
                createProcessorResponse.statusCode.should.eql(201);
                createProcessorResponse.body.exported_functions.should.eql(['createAuthToken']);

                let deleteResponse = await processorRequestSender.deleteProcessor(createProcessorResponse.body.id);
                should(deleteResponse.statusCode).equal(204);
            });
        });
        describe('PUT /v1/processors/{processor_id}', function() {
            it('update a processor', async function() {
                const processor = generateRawJSProcessor('predator ' + uuid());
                const createResponse = await processorRequestSender.createProcessor(processor, validHeaders);
                should(createResponse.statusCode).equal(201);
                const processorId = createResponse.body.id;

                processor.javascript = 'module.exports.add = (a,b) => a + b;';
                processor.description = 'add two numbers';
                const updateResponse = await processorRequestSender.updateProcessor(processorId, processor);
                should(updateResponse.statusCode).equal(200);
                should(updateResponse.body.javascript).equal(processor.javascript);
                should(updateResponse.body.description).equal(processor.description);
                should(updateResponse.body.exported_functions).eql(['add']);

                const deleteResponse = await processorRequestSender.deleteProcessor(processorId);
                should(deleteResponse.statusCode).equal(204);
            });
        });
    });

    describe('Bad requests', function () {
        describe('POST /v1/processors', function () {
            it('Create processor with no js', async () => {
                const requestBody = {
                    name: 'mickey',
                    description: 'Processor with no js'
                };
                let createProcessorResponse = await processorRequestSender.createProcessor(requestBody, validHeaders);
                createProcessorResponse.statusCode.should.eql(400);
            });
            it('Create processor with no name', async () => {
                const requestBody = {
                    description: 'Processor with no name',
                    javascript: 'module.exports = 5;'
                };
                let createProcessorResponse = await processorRequestSender.createProcessor(requestBody, validHeaders);
                createProcessorResponse.statusCode.should.eql(400);
            });
            it('Create processor with no description', async () => {
                const requestBody = {
                    name: 'mickey',
                    javascript: 'module.exports = 5;'
                };
                let createProcessorResponse = await processorRequestSender.createProcessor(requestBody, validHeaders);
                createProcessorResponse.statusCode.should.eql(400);
            });
            it('Create a processor with name that already exists', async function() {
                const name = 'test-processor';
                const processor = generateRawJSProcessor(name);
                const createResponse = await processorRequestSender.createProcessor(processor, validHeaders);
                should(createResponse.statusCode).equal(201);
                const processorId = createResponse.body.id;

                const createWithSameNameResponse = await processorRequestSender.createProcessor(processor, validHeaders);
                should(createWithSameNameResponse.statusCode).equal(400);
                should(createWithSameNameResponse.body.message).equal(ERROR_MESSAGES.PROCESSOR_NAME_ALREADY_EXIST);

                const deleteResponse = await processorRequestSender.deleteProcessor(processorId);
                should(deleteResponse.statusCode).equal(204);
            });
        });
        describe('PUT /v1/processors', function() {
            describe('update a processor name to one that already exist', function() {
                it('should fail and return status code 400', async function() {
                    const name = 'WowProcessor';
                    const processor = generateRawJSProcessor(name);
                    const createResponse = await processorRequestSender.createProcessor(processor, validHeaders);
                    should(createResponse.statusCode).equal(201);
                    const processorId = createResponse.body.id;

                    const otherName = 'NotSoWowProcessor';
                    const otherNameProcessor = generateRawJSProcessor(otherName);
                    const otherProcessorCreateResponse = await processorRequestSender.createProcessor(otherNameProcessor, validHeaders);
                    should(otherProcessorCreateResponse.statusCode).equal(201);
                    const otherNameProcessorId = otherProcessorCreateResponse.body.id;

                    processor.name = otherName;

                    const updateResponse = await processorRequestSender.updateProcessor(processorId, processor);
                    should(updateResponse.statusCode).equal(400);
                    should(updateResponse.body.message).equal(ERROR_MESSAGES.PROCESSOR_NAME_ALREADY_EXIST);

                    const deleteResponsesArray = await Promise.all([processorRequestSender.deleteProcessor(processorId), processorRequestSender.deleteProcessor(otherNameProcessorId)]);
                    should(deleteResponsesArray[0].statusCode).equal(204);
                    should(deleteResponsesArray[1].statusCode).equal(204);
                });
            });
        });
    });

    describe('Sad requests', function () {
        describe('POST /v1/processors', function () {
            it('Create processor with type with invalid js syntax', async () => {
                const requestBody = {
                    name: 'authentication',
                    description: 'Creates authorization token and saves it in the context',
                    javascript: '{ this is not valid javascript }'
                };
                let createProcessorResponse = await processorRequestSender.createProcessor(requestBody, validHeaders);
                createProcessorResponse.statusCode.should.eql(422);
            });

            it('Create processor without export functions', async () => {
                const requestBody = {
                    name: 'authentication',
                    description: 'Creates authorization token and saves it in the context',
                    javascript:
                        `{
                        const uuid = require('uuid/v4');
                        module.exports = {
                        };

                        function createAuthToken(userContext, events, done) {
                        userContext.vars.token = uuid();
                        return done();
                        }
                    }`
                };
                let createProcessorResponse = await processorRequestSender.createProcessor(requestBody, validHeaders);
                createProcessorResponse.statusCode.should.eql(422);
                createProcessorResponse.body.message.should.eql('javascript has 0 exported functions');
            });

            it('Create processor export function that not exists', async () => {
                const requestBody = {
                    name: 'authentication',
                    description: 'Creates authorization token and saves it in the context',
                    javascript:
                        `{
                        const uuid = require('uuid/v4');
                        module.exports = {
                        hello,
                        };

                        function createAuthToken(userContext, events, done) {
                        userContext.vars.token = uuid();
                        return done();
                        }
                    }`
                };
                let createProcessorResponse = await processorRequestSender.createProcessor(requestBody, validHeaders);
                createProcessorResponse.statusCode.should.eql(422);
                createProcessorResponse.body.message.should.eql('javascript syntax validation failed with error: hello is not defined');
            });

            it('Create processor with Unexpected token', async () => {
                const requestBody = {
                    name: 'authentication',
                    description: 'Creates authorization token and saves it in the context',
                    javascript:
                        `{
                        const uuid = require('uuid/v4');
                        module.exports = {
                        hello,
                        };

                        function createAut) {
                        userContext.vars.token = uuid();
                        return done();
                        }
                    }`
                };
                let createProcessorResponse = await processorRequestSender.createProcessor(requestBody, validHeaders);
                createProcessorResponse.statusCode.should.eql(422);
                createProcessorResponse.body.message.should.eql('javascript syntax validation failed with error: Unexpected token )');
            });
        });
        describe('PUT /processors/{processor_id}', () => {
            it('processor doesn\'t exist', async function() {
                const processorId = uuid();
                const processor = generateRawJSProcessor('not stored in db processor');
                const updateResponse = await processorRequestSender.updateProcessor(processorId, processor);
                should(updateResponse.statusCode).equal(404);
            });
        });
        describe('DELETE /processors/{processor_id}', function() {
            it('should return 409 for deleting a processor which is used by other tests', async function() {
                const processor = generateRawJSProcessor('simple-processor');
                const processorInsertResponse = await processorRequestSender.createProcessor(processor, validHeaders);
                should(processorInsertResponse.statusCode).equal(201);

                const processorId = processorInsertResponse.body.id;
                const test = Object.assign({}, basicTest);
                test.processor_id = processorId;
                const testsInsertResponse = await testsRequestSender.createTest(test, validHeaders);
                should(testsInsertResponse.statusCode).equal(201);

                const deleteProcessorResponse = await processorRequestSender.deleteProcessor(processorId);
                should(deleteProcessorResponse.statusCode).equal(409);
                should(deleteProcessorResponse.body.message).startWith(`${ERROR_MESSAGES.PROCESSOR_DELETION_FORBIDDEN}: ${test.name}`);

                const cleanUpTestResponse = await testsRequestSender.deleteTest(validHeaders, testsInsertResponse.body.id);
                should(cleanUpTestResponse.statusCode).equal(200);
                const cleanUpProcessorResponse = await processorRequestSender.deleteProcessor(processorId);
                should(cleanUpProcessorResponse.statusCode).equal(204);
            });
        });
    });
});

function generateRawJSProcessor(name) {
    return {
        name,
        description: 'exports a number',
        javascript: 'module.exports.simple = 5;'
    };
}
