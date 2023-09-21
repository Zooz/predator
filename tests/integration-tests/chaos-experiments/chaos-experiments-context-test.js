const should = require('should'),
    uuid = require('uuid');

const validHeaders = { 'Content-Type': 'application/json' };
const chaosExperimentsRequestSender = require('./helpers/requestCreator');
const { ERROR_MESSAGES } = require('../../../src/common/consts');

describe('Chaos experiments api - with contexts', function () {
    let contextId;
    this.timeout(5000000);
    before(async function () {
        contextId = uuid.v4().toString();
        await chaosExperimentsRequestSender.init();
    });

    describe('Good requests', async function () {
        let chaosExperimentResponse;
        const chaosExperimentsInserted = [];
        describe('GET /v1/chaos-experiments', function () {
            before(async function () {
                const headersWithRandomContext = Object.assign({}, validHeaders, { 'x-context-id': contextId });

                for (let i = 0; i < 3; i++) {
                    const chaosExperiment = chaosExperimentsRequestSender.generateRawChaosExperiment(uuid.v4(), contextId);
                    chaosExperimentResponse = await chaosExperimentsRequestSender.createChaosExperiment(chaosExperiment, headersWithRandomContext);
                    chaosExperimentsInserted.push(chaosExperimentResponse);
                }
            });

            it('get chaos experiments with context_id should return all chaos experiments created with specific context', async function () {
                const headers = {
                    'Content-Type': 'application/json',
                    'x-context-id': contextId
                };
                const getChaosExperimentsResponse = await chaosExperimentsRequestSender.getChaosExperiments(undefined, undefined, undefined, headers);

                should(getChaosExperimentsResponse.statusCode).equal(200);
                const chaosExperiments = getChaosExperimentsResponse.body;
                should(chaosExperiments.length).equal(3);

                const contextAResponse = getChaosExperimentsResponse.body.find(o => o.id === chaosExperimentResponse.body.id);
                should(contextAResponse).not.be.undefined();
            });

            it('get chaos experiments with wrong context_id should no chaos experiments', async function () {
                const headers = {
                    'Content-Type': 'application/json',
                    'x-context-id': uuid.v4()
                };
                const getChaosExperimentsResponse = await chaosExperimentsRequestSender.getChaosExperiments(undefined, undefined, undefined, headers);

                should(getChaosExperimentsResponse.statusCode).equal(200);
                const chaosExperiments = getChaosExperimentsResponse.body;
                should(chaosExperiments.length).equal(0);
            });

            it('get chaos experiments without context_id should return all chaos experiments created', async function () {
                const headers = { 'Content-Type': 'application/json' };
                const getChaosExperimentsResponse = await chaosExperimentsRequestSender.getChaosExperiments(undefined, undefined, undefined, headers);

                should(getChaosExperimentsResponse.statusCode).equal(200);
                const chaosExperiments = getChaosExperimentsResponse.body;
                should(chaosExperiments.length).equal(3);
            });

            after(async function () {
                const chaosExperimentIds = chaosExperimentsInserted.map(experiment => experiment.body.id);
                for (const chaosExperimentId of chaosExperimentIds) {
                    await chaosExperimentsRequestSender.deleteChaosExperiment(chaosExperimentId, { 'Content-Type': 'application/json' });
                }
            });
        });
        describe('GET /v1/chaos_experiment/{experiment_id}', function () {
            let chaosExperimentResponse, experimentId, headers;
            before(async function () {
                headers = {
                    'Content-Type': 'application/json',
                    'x-context-id': contextId
                };
                const chaosExperiment = chaosExperimentsRequestSender.generateRawChaosExperiment(uuid.v4(), contextId);
                const headersWithContext = Object.assign({}, validHeaders, { 'x-context-id': contextId });

                chaosExperimentResponse = await chaosExperimentsRequestSender.createChaosExperiment(chaosExperiment, headersWithContext);
                experimentId = chaosExperimentResponse.body.id;
            });
            it('Get chaos experiment by id with context should return 200', async () => {
                const getChaosExperimentResponse = await chaosExperimentsRequestSender.getChaosExperiment(experimentId, headers);
                getChaosExperimentResponse.statusCode.should.eql(200);
                should(getChaosExperimentResponse.body).containDeep(chaosExperimentResponse.body);
            });
            it('get haos experiment with wrong context_id should return 404', async function () {
                const headers = {
                    'Content-Type': 'application/json',
                    'x-context-id': uuid.v4()
                };
                const getChaosExperimentResponse = await chaosExperimentsRequestSender.getChaosExperiment(experimentId, headers);
                should(getChaosExperimentResponse.statusCode).equal(404);
            });
            it('Get chaos experiment by id without context should return 200', async () => {
                const headers = { 'Content-Type': 'application/json' };
                const getChaosExperimentResponse = await chaosExperimentsRequestSender.getChaosExperiment(experimentId, headers);
                getChaosExperimentResponse.statusCode.should.eql(200);
                should(getChaosExperimentResponse.body).containDeep(chaosExperimentResponse.body);
            });
            after(async function () {
                const deleteResponse = await chaosExperimentsRequestSender.deleteChaosExperiment(experimentId, { 'Content-Type': 'application/json' });
                should(deleteResponse.statusCode).equal(204);
            });
        });
        describe('DELETE /v1/chaos-experiments/{experiment_id}', () => {
            let chaosExperimentResponse, experimentId;
            beforeEach(async function () {
                const chaosExperiment = chaosExperimentsRequestSender.generateRawChaosExperiment(uuid.v4(), contextId);
                const headersWithContext = Object.assign({}, validHeaders, { 'x-context-id': contextId });

                chaosExperimentResponse = await chaosExperimentsRequestSender.createChaosExperiment(chaosExperiment, headersWithContext);
                experimentId = chaosExperimentResponse.body.id;
            });

            it('insert a chaos experiment and then delete it with same context', async () => {
                const headers = {
                    'Content-Type': 'application/json',
                    'x-context-id': contextId
                };

                const deleteResponse = await chaosExperimentsRequestSender.deleteChaosExperiment(experimentId, headers);
                should(deleteResponse.statusCode).equal(204);

                const getChaosExperimentResponse = await chaosExperimentsRequestSender.getChaosExperiment(experimentId, headers);
                should(getChaosExperimentResponse.statusCode).equal(404);
            });
            it('delete a chaos experiment with wrong context should return 404', async () => {
                const headers = {
                    'Content-Type': 'application/json',
                    'x-context-id': uuid.v4()
                };

                const deleteResponse = await chaosExperimentsRequestSender.deleteChaosExperiment(experimentId, headers);
                should(deleteResponse.statusCode).equal(404);
            });
        });
        describe('PUT /v1//chaos-experiments/{experiment_id}', function () {
            let chaosExperiment, chaosExperimentResponse, experimentId;
            beforeEach(async function () {
                chaosExperiment = chaosExperimentsRequestSender.generateRawChaosExperiment(uuid.v4(), contextId);
                const headersWithContext = Object.assign({}, validHeaders, { 'x-context-id': contextId });

                chaosExperimentResponse = await chaosExperimentsRequestSender.createChaosExperiment(chaosExperiment, headersWithContext);
                experimentId = chaosExperimentResponse.body.id;
            });
            afterEach(async function () {
                await chaosExperimentsRequestSender.deleteChaosExperiment(experimentId, { 'Content-Type': 'application/json' });
            });

            it('update a chaos experiment with context id', async function () {
                const updatedChaosExperiment = Object.assign({}, chaosExperiment);
                updatedChaosExperiment.name = 'new name of experiment';
                updatedChaosExperiment.kubeObject.spec = {
                    selector: {
                        namespaces: [
                            'apps'
                        ],
                        labelSelectors: {
                            app: 'live-users-api'
                        }
                    },
                    mode: 'all',
                    action: 'pod-kill',
                    duration: '3m'
                };

                const headers = { 'Content-Type': 'application/json', 'x-context-id': contextId };
                const updateResponse = await chaosExperimentsRequestSender.updateChaosExperiment(experimentId, updatedChaosExperiment, headers);
                should(updateResponse.statusCode).equal(200);
                should(updateResponse.body.kubeObject).deepEqual(updatedChaosExperiment.kubeObject);
                should(updateResponse.body.name).equal(updatedChaosExperiment.name);
            });
            it('update a chaos experiment with wrong context should return 404', async function () {
                const headers = { 'Content-Type': 'application/json', 'x-context-id': uuid.v4() };
                const updatedChaosExperiment = Object.assign({}, chaosExperiment);
                updatedChaosExperiment.name = 'new name of experiment 2.0';
                const updateResponse = await chaosExperimentsRequestSender.updateChaosExperiment(experimentId, updatedChaosExperiment, headers);
                should(updateResponse.statusCode).equal(404);
            });
            it('update a chaos experiment without context should return 200', async function () {
                const headers = { 'Content-Type': 'application/json' };
                const updatedChaosExperiment = Object.assign({}, chaosExperiment);
                updatedChaosExperiment.name = 'new name of experiment 2.0';
                const updateResponse = await chaosExperimentsRequestSender.updateChaosExperiment(experimentId, updatedChaosExperiment, headers);
                should(updateResponse.statusCode).equal(200);
                should(updateResponse.body.name).equal(updatedChaosExperiment.name);
            });
        });
    });

    describe('Bad requests', function () {
        describe('POST /v1/chaos-experiments', function () {
            it('Create chaos experiment with no name', async () => {
                const chaosExperiment = chaosExperimentsRequestSender.generateRawChaosExperiment();
                chaosExperiment.name = undefined;
                const createChaosExperimentResponse = await chaosExperimentsRequestSender.createChaosExperiment(chaosExperiment, validHeaders);
                createChaosExperimentResponse.statusCode.should.eql(400);
            });
            it('Create chaos experiment with no kubeObject', async () => {
                const chaosExperiment = chaosExperimentsRequestSender.generateRawChaosExperiment('my-test', contextId);
                chaosExperiment.kubeObject = undefined;
                const createChaosExperimentResponse = await chaosExperimentsRequestSender.createChaosExperiment(chaosExperiment, validHeaders);
                createChaosExperimentResponse.statusCode.should.eql(400);
            });
            it('Create a chaos experiment with name that already exists', async function () {
                const name = 'test-experiment';
                const chaosExperiment = chaosExperimentsRequestSender.generateRawChaosExperiment(name, contextId);
                const createChaosExperimentResponse = await chaosExperimentsRequestSender.createChaosExperiment(chaosExperiment, validHeaders);
                should(createChaosExperimentResponse.statusCode).equal(201);
                const experimentId = createChaosExperimentResponse.body.id;

                const creatChaosExperimentWithSameNameResponse = await chaosExperimentsRequestSender.createChaosExperiment(chaosExperiment, validHeaders);
                should(creatChaosExperimentWithSameNameResponse.statusCode).equal(400);
                should(creatChaosExperimentWithSameNameResponse.body.message).equal(ERROR_MESSAGES.CHAOS_EXPERIMENT_NAME_ALREADY_EXIST);

                const deleteResponse = await chaosExperimentsRequestSender.deleteChaosExperiment(experimentId);
                should(deleteResponse.statusCode).equal(204);
            });
        });
        describe('PUT /v1//chaos-experiments/{experiment_id}', function () {
            let chaosExperiment, chaosExperimentResponse, experimentId;
            beforeEach(async function () {
                chaosExperiment = chaosExperimentsRequestSender.generateRawChaosExperiment(uuid.v4(), contextId);
                const headersWithContext = Object.assign({}, validHeaders, { 'x-context-id': contextId });

                chaosExperimentResponse = await chaosExperimentsRequestSender.createChaosExperiment(chaosExperiment, headersWithContext);
                experimentId = chaosExperimentResponse.body.id;
            });
            afterEach(async function () {
                await chaosExperimentsRequestSender.deleteChaosExperiment(experimentId, { 'Content-Type': 'application/json' });
            });
            it('Update chaos experiment with no name', async () => {
                const headers = { 'Content-Type': 'application/json' };
                const updatedChaosExperiment = Object.assign({}, chaosExperiment);
                updatedChaosExperiment.name = undefined;
                const updateChaosExperimentResponse = await chaosExperimentsRequestSender.updateChaosExperiment(experimentId, updatedChaosExperiment, headers);
                updateChaosExperimentResponse.statusCode.should.eql(400);
            });
            it('Update chaos experiment with no kubeObject', async () => {
                const headers = { 'Content-Type': 'application/json' };
                const updatedChaosExperiment = Object.assign({}, chaosExperiment);
                updatedChaosExperiment.kubeObject = undefined;
                const updateChaosExperimentResponse = await chaosExperimentsRequestSender.updateChaosExperiment(experimentId, updatedChaosExperiment, headers);
                updateChaosExperimentResponse.statusCode.should.eql(400);
            });
            it('Update chaos experiment with same id but different name', async function () {
                const headers = { 'Content-Type': 'application/json' };
                const updatedChaosExperiment = Object.assign({}, chaosExperiment);
                updatedChaosExperiment.name = 'new-experiment 3.0';
                const chaosExperimentResponse = await chaosExperimentsRequestSender.createChaosExperiment(updatedChaosExperiment);
                chaosExperimentResponse.statusCode.should.eql(201);

                const updateChaosExperimentResponse = await chaosExperimentsRequestSender.updateChaosExperiment(experimentId, updatedChaosExperiment, headers);
                updateChaosExperimentResponse.statusCode.should.eql(400);
            });
        });
    });
});
