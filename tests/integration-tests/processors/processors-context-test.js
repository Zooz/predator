const should = require('should'),
    uuid = require('uuid');

const validHeaders = { 'Content-Type': 'application/json' };
const processorRequestSender = require('./helpers/requestCreator');
const testsRequestSender = require('../tests/helpers/requestCreator');

const contextId = uuid.v4();
describe('Processors api - with contexts', function () {
    this.timeout(5000000);
    before(async function () {
        await processorRequestSender.init();
        await testsRequestSender.init();
    });

    describe('Good requests', async function () {
        let processorContextResponse, processorNoContextResponse, processorRandomContextResponse;
        const processorsInserted = [];
        describe('GET /v1/processors', function () {
            before(async function () {
                const headersWithContext = Object.assign({}, validHeaders, { 'x-context-id': contextId });
                const headersWithRandomContext = Object.assign({}, validHeaders, { 'x-context-id': 'mickey' });
                const headersNoContext = Object.assign({}, validHeaders);

                let processor = generateRawJSProcessor(uuid.v4());
                processorContextResponse = await processorRequestSender.createProcessor(processor, headersWithContext);
                processorsInserted.push(processorContextResponse);

                processor = generateRawJSProcessor(uuid.v4());
                processorRandomContextResponse = await processorRequestSender.createProcessor(processor, headersWithRandomContext);
                processorsInserted.push(processorRandomContextResponse);

                processor = generateRawJSProcessor(uuid.v4());
                processorNoContextResponse = await processorRequestSender.createProcessor(processor, headersNoContext);
                processorsInserted.push(processorNoContextResponse);
            });

            it('get processors with context_id should return all processors created with specific context', async function () {
                const headers = { 'Content-Type': 'application/json', 'x-context-id': contextId };
                const getProcessorsResponse = await processorRequestSender.getProcessors(undefined, undefined, undefined, headers);

                should(getProcessorsResponse.statusCode).equal(200);
                const processors = getProcessorsResponse.body;
                should(processors.length).equal(1);

                const contextAResponse = getProcessorsResponse.body.find(o => o.id === processorContextResponse.body.id);
                should(contextAResponse).not.be.undefined();
            });

            it('get processors with wrong context_id should no processors', async function () {
                const headers = { 'Content-Type': 'application/json', 'x-context-id': uuid.v4() };
                const getProcessorsResponse = await processorRequestSender.getProcessors(undefined, undefined, undefined, headers);

                should(getProcessorsResponse.statusCode).equal(200);
                const processors = getProcessorsResponse.body;
                should(processors.length).equal(0);
            });

            it('get processors without context_id should return all processors created', async function () {
                const headers = { 'Content-Type': 'application/json' };
                const getProcessorsResponse = await processorRequestSender.getProcessors(undefined, undefined, undefined, headers);

                should(getProcessorsResponse.statusCode).equal(200);
                const processors = getProcessorsResponse.body;
                should(processors.length).equal(3);
            });

            after(async function () {
                const processorIds = processorsInserted.map(processor => processor.body.id);
                for (const processorId of processorIds) {
                    await processorRequestSender.deleteProcessor(processorId, { 'Content-Type': 'application/json' });
                }
            });
        });
        describe('DELETE /v1/processors/{processor_id}', () => {
            let processorContextResponse, processorId;
            beforeEach(async function () {
                const processor = generateRawJSProcessor(uuid.v4());
                const headersWithContext = Object.assign({}, validHeaders, { 'x-context-id': contextId });

                processorContextResponse = await processorRequestSender.createProcessor(processor, headersWithContext);
                processorId = processorContextResponse.body.id;
            });

            afterEach(async function () {
                await processorRequestSender.deleteProcessor(processorId, { 'Content-Type': 'application/json' });
            });

            it('insert a processor and then delete it with same context', async () => {
                const headers = { 'Content-Type': 'application/json', 'x-context-id': contextId };

                const deleteResponse = await processorRequestSender.deleteProcessor(processorId, headers);
                should(deleteResponse.statusCode).equal(204);

                const getProcessorResponse = await processorRequestSender.getProcessor(processorId, headers);
                should(getProcessorResponse.statusCode).equal(404);
            });
            it('delete a processor with wrong context should return 404', async () => {
                const headers = { 'Content-Type': 'application/json', 'x-context-id': uuid.v4() };

                const deleteResponse = await processorRequestSender.deleteProcessor(processorId, headers);
                should(deleteResponse.statusCode).equal(404);
            });
        });
        describe('GET /v1/processors/{processor_id}', function () {
            let processorData, processor, headers;
            before(async function () {
                headers = { 'Content-Type': 'application/json', 'x-context-id': contextId };
                processorData = generateRawJSProcessor('mickeys-processor');
                const processorResponse = await processorRequestSender.createProcessor(processorData, headers);
                processor = processorResponse.body;
            });
            it('Get processor by id with context should return 200', async () => {
                const getProcessorResponse = await processorRequestSender.getProcessor(processor.id, headers);
                getProcessorResponse.statusCode.should.eql(200);
                should(getProcessorResponse.body).containDeep(processorData);
                should(getProcessorResponse.body.exported_functions).eql(['simple']);
            });
            it('get processor with wrong context_id should return 404', async function () {
                const headers = { 'Content-Type': 'application/json', 'x-context-id': uuid.v4() };
                const getProcessorsResponse = await processorRequestSender.getProcessor(processorRandomContextResponse.body.id, headers);
                should(getProcessorsResponse.statusCode).equal(404);
            });
            it('Get processor by id without context should return 200', async () => {
                const getProcessorResponse = await processorRequestSender.getProcessor(processor.id, { 'Content-Type': 'application/json' });
                getProcessorResponse.statusCode.should.eql(200);
                should(getProcessorResponse.body).containDeep(processorData);
                should(getProcessorResponse.body.exported_functions).eql(['simple']);
            });
            after(async function () {
                const deleteResponse = await processorRequestSender.deleteProcessor(processor.id, { 'Content-Type': 'application/json' });
                should(deleteResponse.statusCode).equal(204);
            });
        });
        describe('PUT /v1/processors/{processor_id}', function () {
            let processorData, processor, processorId, headers;
            beforeEach(async function () {
                headers = { 'Content-Type': 'application/json', 'x-context-id': contextId };
                processorData = generateRawJSProcessor('mickeys-processor');
                const processorResponse = await processorRequestSender.createProcessor(processorData, headers);
                processor = processorResponse.body;
                processorId = processorResponse.body.id;
            });
            it('update a processor with context', async function () {
                processorData.javascript = 'module.exports.add = (a,b) => a + b;';
                processorData.description = 'add two numbers';
                const updateResponse = await processorRequestSender.updateProcessor(processorId, processorData, headers);
                should(updateResponse.statusCode).equal(200);
                should(updateResponse.body.javascript).equal(processorData.javascript);
                should(updateResponse.body.description).equal(processorData.description);
                should(updateResponse.body.exported_functions).eql(['add']);
            });
            it('update a processor with wrong context should return 404', async function () {
                headers = { 'Content-Type': 'application/json', 'x-context-id': uuid.v4() };

                processorData.javascript = 'module.exports.add = (a,b) => a + b;';
                processorData.description = 'add two numbers';
                const updateResponse = await processorRequestSender.updateProcessor(processorId, processorData, headers);
                should(updateResponse.statusCode).equal(404);
            });
            it('update a processor without context should return 200', async function () {
                processorData.javascript = 'module.exports.add = (a,b) => a + b;';
                processorData.description = 'add two numbers';
                const updateResponse = await processorRequestSender.updateProcessor(processorId, processorData, { 'Content-Type': 'application/json' });
                should(updateResponse.statusCode).equal(200);
                should(updateResponse.body.javascript).equal(processorData.javascript);
                should(updateResponse.body.description).equal(processorData.description);
                should(updateResponse.body.exported_functions).eql(['add']);
            });
            afterEach(async function () {
                const deleteResponse = await processorRequestSender.deleteProcessor(processor.id, { 'Content-Type': 'application/json' });
                should(deleteResponse.statusCode).equal(204);
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
