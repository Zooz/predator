const should = require('should'),
    uuid = require('uuid/v4'),
    nock = require('nock');

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
                // TODO: when DELETE /processors is implemented, use processorsInserted to empty the table.
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
                    type: 'file_download',
                    file_url: 'https://authentication.predator.dev/?dl=1'
                };
                let createProcessorResponse = await requestSender.createProcessor(requestBody, validHeaders);
                createProcessorResponse.statusCode.should.eql(201);
            });
            it('Create processor with type raw_javascript', async () => {
                const requestBody = {
                    name: 'authentication',
                    description: 'Creates authorization token and saves it in the context',
                    type: 'raw_javascript',
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
                    type: 'file_download'
                };
                let createProcessorResponse = await requestSender.createProcessor(requestBody, validHeaders);
                createProcessorResponse.statusCode.should.eql(400);
            });
            it('Create processor with type raw_javascript and no js', async () => {
                const requestBody = {
                    name: 'javascript-me',
                    description: 'Processor with no js',
                    type: 'raw_javascript',
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
                    type: 'file_download',
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
                    type: 'file_download',
                    file_url: 'https://authentication.predator.dev/?dl=1'
                };
                let createProcessorResponse = await requestSender.createProcessor(requestBody, validHeaders);
                createProcessorResponse.statusCode.should.eql(422);
            });
        });
    });
});

function generateRawJSProcessor(name) {
    return {
        name,
        description: 'exports a number',
        type: 'raw_javascript',
        javascript: 'module.exports = 5;'
    };
}
