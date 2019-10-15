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
                file_url: 'https://authentication.predator.dev/?dl=1'
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
    });
});