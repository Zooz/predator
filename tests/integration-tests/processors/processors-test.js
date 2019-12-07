const should = require('should'),
    uuid = require('uuid/v4'),
    nock = require('nock');

let validHeaders = { 'Content-Type': 'application/json' };
const requestSender = require('./helpers/requestCreator');
const { PROCESSOR_TYPE_FILE_DOWNLOAD, PROCESSOR_TYPE_RAW_JAVASCRIPT } = require('../../../src/common/consts');
describe('Processors api', function() {
    this.timeout(5000000);
    before(async function () {
        await requestSender.init();
    });
    beforeEach(function() {
        nock.cleanAll();
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
        describe('POST /v1/processors/{processor_id}/download', () => {
            it('Update successfully processor content', async function() {
                let processorId;
                const uri = '/some-processor-name';
                const url = 'https://fakesite.com';
                const processor = {
                    name: 'some-user-processor',
                    description: 'This is a description',
                    type: PROCESSOR_TYPE_FILE_DOWNLOAD,
                    file_url: url + uri
                };
                const oldContent = 'module.exports=5;';
                nock(url).get(uri).reply(200, oldContent);
                const insertProcessorResponse = await requestSender.createProcessor(processor, validHeaders);
                should(insertProcessorResponse.statusCode).equal(201);
                should(insertProcessorResponse.body.javascript).equal(oldContent);
                processorId = insertProcessorResponse.body.id;

                const newContent = 'module.exports = 9;';
                nock(url).get(uri).reply(200, newContent);
                const updatedProcessorResponse = await requestSender.redownloadJSProcessor(processorId);
                should(updatedProcessorResponse.statusCode).equal(204);

                const getProcessorResponse = await requestSender.getProcessor(processorId);
                should(getProcessorResponse.statusCode).equal(200);
                should(getProcessorResponse.body.javascript).equal(newContent);
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
            it('Create processor with type file_download', async () => {
                nock('https://authentication.predator.dev').get('/?dl=1').reply(200,
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
                );

                const requestBody = {
                    name: 'authentication',
                    description: 'Creates authorization token and saves it in the context',
                    type: PROCESSOR_TYPE_FILE_DOWNLOAD,
                    file_url: 'https://authentication.predator.dev/?dl=1'
                };
                let createProcessorResponse = await requestSender.createProcessor(requestBody, validHeaders);
                createProcessorResponse.statusCode.should.eql(201);
            });
            it('Create processor with type raw_javascript', async () => {
                const requestBody = {
                    name: 'authentication',
                    description: 'Creates authorization token and saves it in the context',
                    type: PROCESSOR_TYPE_RAW_JAVASCRIPT,
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
            const baseURL = 'http://cloud.com';
            const firstFileUri = '/files/888';
            const secondFileUri = '/files/999';
            const fileDownloadProcessor = {
                name: 'predator-file',
                type: PROCESSOR_TYPE_FILE_DOWNLOAD,
                description: 'some desc'
            };
            it('update a raw_javascript type processor', async function() {
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
            it('update a file_download type processor - change to different file_url', async function() {
                const processor = {
                    name: 'predator-file',
                    type: PROCESSOR_TYPE_FILE_DOWNLOAD,
                    description: 'some desc',
                    file_url: baseURL + firstFileUri
                };
                nock(baseURL).get(firstFileUri).reply(200, 'module.exports = 9');
                const createResponse = await requestSender.createProcessor(processor, validHeaders);
                should(createResponse.statusCode).equal(201);
                const processorId = createResponse.body.id;

                const updatedFileJSContent = 'module.exports = () => 1';
                processor.file_url = baseURL + secondFileUri;
                nock(baseURL).get(secondFileUri).reply(200, updatedFileJSContent);
                const updateResponse = await requestSender.updateProcessor(processorId, processor, true);
                should(updateResponse.statusCode).equal(200);
                should(updateResponse.body.file_url).equal(processor.file_url);
                should(updateResponse.body.javascript).equal(updatedFileJSContent);
            });
            it('from file_download processor to raw_javascript', async function() {
                nock(baseURL).get(firstFileUri).reply(200, 'module.exports = 9');
                fileDownloadProcessor.file_url = baseURL + firstFileUri;
                const createResponse = await requestSender.createProcessor(fileDownloadProcessor, validHeaders);
                should(createResponse.statusCode).equal(201);
                const processorId = createResponse.body.id;

                const processor = Object.assign({}, fileDownloadProcessor);
                processor.file_url = undefined;
                processor.type = PROCESSOR_TYPE_RAW_JAVASCRIPT;
                processor.javascript = 'module.exports = 1;';
                const updateResponse = await requestSender.updateProcessor(processorId, processor, true);
                should(updateResponse.statusCode).equal(200);
                should(updateResponse.body.type).equal(processor.type);
                should(updateResponse.body.javascript).equal(processor.javascript);
                should(updateResponse.body.file_url).equal(undefined);
            });
            it('from raw_javascript processor to file_download', async function() {
                const processor = generateRawJSProcessor('raw_js');
                const createResponse = await requestSender.createProcessor(processor, validHeaders);
                should(createResponse.statusCode).equal(201);
                const processorId = createResponse.body.id;

                const jsContent = 'module.exports = 25';
                fileDownloadProcessor.file_url = baseURL + firstFileUri;
                nock(baseURL).get(firstFileUri).reply(200, jsContent);
                const updateResponse = await requestSender.updateProcessor(processorId, fileDownloadProcessor, true);
                should(updateResponse.statusCode).equal(200);
                should(updateResponse.body.type).equal(fileDownloadProcessor.type);
                should(updateResponse.body.javascript).equal(jsContent);
                should(updateResponse.body.name).equal(fileDownloadProcessor.name);
            });
            it('update a processor with dl = false', async function() {
                nock(baseURL).get(firstFileUri).reply(200, 'module.exports = 5');
                const createResponse = await requestSender.createProcessor(fileDownloadProcessor, validHeaders);
                should(createResponse.statusCode).equal(201);
                const processorId = createResponse.body.id;
                const jsContent = createResponse.body.javascript;

                const updatedProcessor = Object.assign({}, fileDownloadProcessor);
                updatedProcessor.name = 'new name';
                updatedProcessor.file_url = baseURL + secondFileUri;
                nock(baseURL).get(secondFileUri).reply(200, 'const a = 5;');
                const updateResponse = await requestSender.updateProcessor(processorId, updatedProcessor, false);
                should(updateResponse.statusCode).equal(200);
                should(updateResponse.body.name).equal(updatedProcessor.name);
                should(updateResponse.body.javascript).equal(jsContent);
                should(updateResponse.body.description).equal(updatedProcessor.description);
                should(updateResponse.body.file_url).equal(updatedProcessor.file_url).and.not.equal(fileDownloadProcessor.file_url);
            });
        });
    });

    describe('Bad requests', function () {
        describe('POST /v1/processors', function () {
            it('Create processor with unknown type', async () => {
                const requestBody = {
                    name: 'bad-processor',
                    description: 'Processor with unknown type',
                    type: 'unknown'
                };
                let createProcessorResponse = await requestSender.createProcessor(requestBody, validHeaders);
                createProcessorResponse.statusCode.should.eql(400);
            });
            it('Create processor with type file_download and no url', async () => {
                const requestBody = {
                    name: 'download-me',
                    description: 'Processor with no file url',
                    type: PROCESSOR_TYPE_FILE_DOWNLOAD
                };
                let createProcessorResponse = await requestSender.createProcessor(requestBody, validHeaders);
                createProcessorResponse.statusCode.should.eql(400);
            });
            it('Create processor with type raw_javascript and no js', async () => {
                const requestBody = {
                    name: 'javascript-me',
                    description: 'Processor with no js',
                    type: PROCESSOR_TYPE_RAW_JAVASCRIPT,
                    file_url: 'bad'
                };
                let createProcessorResponse = await requestSender.createProcessor(requestBody, validHeaders);
                createProcessorResponse.statusCode.should.eql(400);
            });
        });
    });

    describe('Sad requests', function () {
        describe('POST /v1/processors', function () {
            it('Create processor with type file_download and invalid file_url', async () => {
                nock('https://authentication.predator.dev').get('/?dl=1').replyWithError('error downloading file');

                const requestBody = {
                    name: 'authentication',
                    description: 'Creates authorization token and saves it in the context',
                    type: PROCESSOR_TYPE_FILE_DOWNLOAD,
                    file_url: 'https://authentication.predator.dev/?dl=1'
                };
                let createProcessorResponse = await requestSender.createProcessor(requestBody, validHeaders);
                createProcessorResponse.statusCode.should.eql(422);
            });
            it('Create processor with type file_download and invalid js syntax', async () => {
                nock('https://authentication.predator.dev').get('/?dl=1').reply(200,
                    `{
                     const uuid = require('uuid/v4');
                     module.exports = {
                       createAuthToken
                     };

                     function createAuthToken(userContext, events, done) {
                       userContext.vars.token = uuid();
                       return done();
                     }

                     this is not valid javascript
                 }`
                );
                const requestBody = {
                    name: 'authentication',
                    description: 'Creates authorization token and saves it in the context',
                    type: PROCESSOR_TYPE_FILE_DOWNLOAD,
                    file_url: 'https://authentication.predator.dev/?dl=1'
                };
                let createProcessorResponse = await requestSender.createProcessor(requestBody, validHeaders);
                createProcessorResponse.statusCode.should.eql(422);
            });
        });
        describe('POST /processors/{processor_id}/download', () => {
            it('try for a raw_javascript processor', async function() {
                const rawJSProcessor = generateRawJSProcessor('name');
                const createProcessorResponse = await requestSender.createProcessor(rawJSProcessor, validHeaders);
                should(createProcessorResponse.statusCode).equal(201);
                const processorId = createProcessorResponse.body.id;
                const response = await requestSender.redownloadJSProcessor(processorId);
                should(response.statusCode).equal(400);
            });

            it('processor doesn\'t exist', async function() {
                const processorId = uuid();
                const requestResponse = await requestSender.redownloadJSProcessor(processorId);
                should(requestResponse.statusCode).equal(404);
            });

            it('failed download', async function() {
                let processorId;
                const uri = '/some-processor-name';
                const url = 'https://fakesite.com';
                const processor = {
                    name: 'some-user-processor',
                    description: 'This is a description',
                    type: PROCESSOR_TYPE_FILE_DOWNLOAD,
                    file_url: url + uri
                };

                nock(url).get(uri).reply(200, 'module.exports = 5;');
                const insertProcessorResponse = await requestSender.createProcessor(processor, validHeaders);
                should(insertProcessorResponse.statusCode).equal(201);
                processorId = insertProcessorResponse.body.id;

                nock(url).get(uri).reply(500, {});
                const updatedProcessorResponse = await requestSender.redownloadJSProcessor(processorId);
                should(updatedProcessorResponse.statusCode).equal(422);
            });
        });
        describe('PUT /processors/{processor_id}', () => {
            it('processor doesn\'t exist', async function() {
                const processorId = uuid();
                const processor = generateRawJSProcessor('not stored in db processor');
                const updateResponse = await requestSender.updateProcessor(processorId, processor);
                should(updateResponse.statusCode).equal(404);
            });
            it('bad dl query parameter value', async function() {
                const processorId = uuid();
                const validationErrorMessageObject = {
                    message: 'Input validation error',
                    validation_errors: [
                        'query/dl should be boolean'
                    ]
                };
                const processor = {
                    name: 'expected to fail',
                    description: 'bad dl value',
                    type: PROCESSOR_TYPE_FILE_DOWNLOAD,
                    file_url: 'http://some.url.com'
                };
                const updateResponse = await requestSender.updateProcessor(processorId, processor, 'bad_value');
                should(updateResponse.statusCode).equal(400);
                should(updateResponse.body).deepEqual(validationErrorMessageObject);
            });
            it('fail to download  file_download type processor', async function() {
                const baseURL = 'http://cloud.com';
                const uri = '/files/999';
                const updatedUri = '/files/888';
                const processor = {
                    name: 'some processor',
                    description: 'failed download',
                    type: PROCESSOR_TYPE_FILE_DOWNLOAD,
                    file_url: baseURL + uri
                };
                nock(baseURL).get(uri).reply(200, 'module.exports = 10;');
                const createResponse = await requestSender.createProcessor(processor, validHeaders);
                should(createResponse.statusCode).equal(201);
                const processorId = createResponse.body.id;

                nock(baseURL).get(updatedUri).reply(500, { message: 'Internal Server Error' });
                processor.file_url = baseURL + updatedUri;
                const updateResponse = await requestSender.updateProcessor(processorId, processor, true);
                should(updateResponse.statusCode).equal(422);
            });
        });
    });
});

function generateRawJSProcessor(name) {
    return {
        name,
        description: 'exports a number',
        type: PROCESSOR_TYPE_RAW_JAVASCRIPT,
        javascript: 'module.exports = 5;'
    };
}
