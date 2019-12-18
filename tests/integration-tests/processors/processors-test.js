const should = require('should'),
    uuid = require('uuid/v4');

let validHeaders = { 'Content-Type': 'application/json' };
const requestSender = require('./helpers/requestCreator');
describe('Processors api', function() {
    this.timeout(5000000);
    before(async function () {
        await requestSender.init();
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
                    const processorRes = await requestSender.createProcessor(processor, validHeaders);
                    processorsInserted.push(processorRes);
                }
            });
            it('Check default paging values (from = 0, limit = 100)', async function() {
                let getProcessorsResponse = await requestSender.getProcessors();

                should(getProcessorsResponse.statusCode).equal(200);

                const processors = getProcessorsResponse.body;
                should(processors.length).equal(100);
            });

            it('Get a page', async function() {
                const from = 25, limit = 50;
                let getProcessorsResponse = await requestSender.getProcessors(from, limit);

                should(getProcessorsResponse.statusCode).equal(200);

                const processors = getProcessorsResponse.body;
                should(processors.length).equal(limit);
            });

            it('Validate from parameter starts from the correct index', async function() {
                const from = 0, limit = 50;
                let page1Response = await requestSender.getProcessors(from, limit);
                let page2Response = await requestSender.getProcessors(from + 1, limit);

                should(page1Response.statusCode).equal(200);
                should(page2Response.statusCode).equal(200);

                const page1Processors = page1Response.body;
                const page2Processors = page2Response.body;
                should(page1Processors[1]).deepEqual(page2Processors[0]);
            });

            it('Get a page with limit > # of processors', async function() {
                const from = 0, limit = 1000;
                let getProcessorsResponse = await requestSender.getProcessors(from, limit);

                should(getProcessorsResponse.statusCode).equal(200);

                const processors = getProcessorsResponse.body;
                should(processors.length).greaterThanOrEqual(101);
            });
            after(async function() {
                const processorIds = processorsInserted.map(processor => processor.body.id);
                processorIds.forEach(async (processorId) => {
                    await requestSender.deleteProcessor(processorId);
                });
            });
        });
        describe('DELETE /v1/processors/{processor_id}', () => {
            it('insert a processor and then delete it', async () => {
                const processor = generateRawJSProcessor('some_id');
                const insertResponse = await requestSender.createProcessor(processor, validHeaders);

                should(insertResponse.statusCode).equal(201);
                const processorId = insertResponse.body.id;

                const deleteResponse = await requestSender.deleteProcessor(processorId);
                should(deleteResponse.statusCode).equal(204);

                const getProcessorResponse = await requestSender.getProcessor(processorId);
                should(getProcessorResponse.statusCode).equal(404);
            });

            it('delete a processor that doesn\'t exist - expect status code 204', async () => {
                const processorId = uuid();
                // making sure that there is no processor with the generated uuid (not taking any chances :) )
                await requestSender.deleteProcessor(processorId);
                const deleteResponse = await requestSender.deleteProcessor(processorId);
                should(deleteResponse.statusCode).equal(204);
            });
        });
        describe('GET /v1/processors/{processor_id}', function () {
            let processorData, processor;
            before(async function() {
                processorData = generateRawJSProcessor('mickeys-processor');
                const processorResponse = await requestSender.createProcessor(processorData, validHeaders);
                processor = processorResponse.body;
            });
            it('Get processor by id', async () => {
                let getProcessorResponse = await requestSender.getProcessor(processor.id, validHeaders);
                getProcessorResponse.statusCode.should.eql(200);
                should(getProcessorResponse.body).containDeep(processorData);
            });
            it('Get non-existent processor by id', async () => {
                let getProcessorResponse = await requestSender.getProcessor(uuid(), validHeaders);
                getProcessorResponse.statusCode.should.eql(404);
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
                let createProcessorResponse = await requestSender.createProcessor(requestBody, validHeaders);
                createProcessorResponse.statusCode.should.eql(201);
            });
        });
        describe('PUT /v1/processors/{processor_id}', function() {
            it('update a processor', async function() {
                const processor = generateRawJSProcessor('predator');
                const createResponse = await requestSender.createProcessor(processor, validHeaders);
                should(createResponse.statusCode).equal(201);
                const processorId = createResponse.body.id;

                processor.javascript = 'module.exports.add = (a,b) => a + b;';
                processor.description = 'add two numbers';
                const updateResponse = await requestSender.updateProcessor(processorId, processor);
                should(updateResponse.statusCode).equal(200);
                should(updateResponse.body.javascript).equal(processor.javascript);
                should(updateResponse.body.description).equal(processor.description);
            });
        });
    });

    describe('Bad requests', function () {
        describe('POST /v1/processors', function () {
            it('Create processor with no js', async () => {
                const requestBody = {
                    name: 'mickey',
                    description: 'Processor with no js',
                };
                let createProcessorResponse = await requestSender.createProcessor(requestBody, validHeaders);
                createProcessorResponse.statusCode.should.eql(400);
            });
            it('Create processor with no name', async () => {
                const requestBody = {
                    description: 'Processor with no name',
                    javascript: 'module.exports = 5;'
                };
                let createProcessorResponse = await requestSender.createProcessor(requestBody, validHeaders);
                createProcessorResponse.statusCode.should.eql(400);
            });
            it('Create processor with no description', async () => {
                const requestBody = {
                    name: 'mickey',
                    javascript: 'module.exports = 5;'
                };
                let createProcessorResponse = await requestSender.createProcessor(requestBody, validHeaders);
                createProcessorResponse.statusCode.should.eql(400);
            });
        });
    });

    describe('Sad requests', function () {
        describe('POST /v1/processors', function () {
            it('Create processor with type with invalid js syntax', async () => {
                const requestBody = {
                    name: 'authentication',
                    description: 'Creates authorization token and saves it in the context',
                    javascript: `{ this is not valid javascript }`
                };
                let createProcessorResponse = await requestSender.createProcessor(requestBody, validHeaders);
                createProcessorResponse.statusCode.should.eql(422);
            });
        });
        describe('PUT /processors/{processor_id}', () => {
            it('processor doesn\'t exist', async function() {
                const processorId = uuid();
                const processor = generateRawJSProcessor('not stored in db processor');
                const updateResponse = await requestSender.updateProcessor(processorId, processor);
                should(updateResponse.statusCode).equal(404);
            });
        });
    });
});

function generateRawJSProcessor(name) {
    return {
        name,
        description: 'exports a number',
        javascript: 'module.exports = 5;'
    };
}
