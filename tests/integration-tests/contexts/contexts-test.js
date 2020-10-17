
const { expect } = require('chai');

const contextRequestSender = require('./helpers/requestCreator');

describe('Contexts api', function () {
    this.timeout(5000000);
    before(async function () {
        await contextRequestSender.init();
    });

    describe('Good requests', async function () {
        describe('GET /v1/contexts', async function () {
            before('clean contexts', async function() {
                const contextResponse = await contextRequestSender.getContexts();
                await Promise.all(contextResponse.body.map(({ id }) => contextRequestSender.deleteContext({ id: id })));
            });
            const numOfContextsToInsert = 5;
            it(`return ${numOfContextsToInsert} contexts`, async function() {
                const contextsToInsert = (new Array(numOfContextsToInsert))
                    .fill(0, 0, numOfContextsToInsert)
                    .map((_, idx) => ({ name: String(idx) }));
                await Promise.all(contextsToInsert.map(context => contextRequestSender.createContext(context)));

                const contextGetResponse = await contextRequestSender.getContexts();
                expect(contextGetResponse.statusCode).to.equal(200);

                const contexts = contextGetResponse.body;
                expect(contexts).to.be.an('array').and.have.lengthOf(numOfContextsToInsert);
            });
        });
        describe('POST /v1/contexts', function () {
            it('Create context and response 201 status code', async function() {
                const createContextResponse = await contextRequestSender.createContext({ name: 'foo' });
                expect(createContextResponse.statusCode).to.equal(201);
                expect(createContextResponse.body.name).to.equal('foo');
            });
        });
    });

    describe('Bad requests', function () {
        describe('POST /v1/contexts', function () {
            describe('name validation', function() {
                before('clean contexts', async function() {
                    const contextResponse = await contextRequestSender.getContexts();
                    await Promise.all(contextResponse.body.map(({ id }) => contextRequestSender.deleteContext({ id: id })));
                });
                it('invalidates name duplicates', async function () {
                    const uniqueName = { name: 'bob' };
                    await contextRequestSender.createContext(uniqueName);
                    const duplicateNameResponse = await contextRequestSender.createContext(uniqueName);
                    expect(duplicateNameResponse.statusCode).to.equal(400);
                });
            });
        });
    });
});