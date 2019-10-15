const should = require('should'),
    nock = require('nock');

let validHeaders = { 'Content-Type': 'application/json' };
const requestSender = require('./helpers/requestCreator');
describe('Processors api', function() {
    this.timeout(5000000);
    before(async function () {
        await requestSender.init();
    });

    describe('Good requests', function() {
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

    describe('Bad requests', function () {
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

    describe('Sad requests', function () {
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
    });
});