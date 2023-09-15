const should = require('should'),
    uuid = require('uuid');

const validHeaders = { 'Content-Type': 'application/json' };
const chaosExperimentsRequestSender = require('./helpers/requestCreator');
const testsRequestSender = require('../tests/helpers/requestCreator');
const { ERROR_MESSAGES } = require('../../../src/common/consts');
describe('Chaos experiments api - with contexts', function () {
    let contextId;
    this.timeout(5000000);
    before(async function () {
        contextId = uuid.v4().toString();
        await chaosExperimentsRequestSender.init();
        await testsRequestSender.init();
    });

    describe('Good requests', async function () {
        let chaosExperimentResponse;
        const chaosExperimentsInserted = [];
        describe('GET /v1/chaos-experiments', function () {
            before(async function () {
                const headersWithRandomContext = Object.assign({}, validHeaders, { 'x-context-id': contextId });

                for (let i = 0; i < 3; i++) {
                    const chaosExperiment = generateRawChaosExperiment(uuid.v4(), contextId);
                    chaosExperimentResponse = await chaosExperimentsRequestSender.createChaosExperiment(chaosExperiment, headersWithRandomContext);
                    chaosExperimentsInserted.push(chaosExperimentResponse);
                }
            });

            it('get chaos experiments with context_id should return all processors created with specific context', async function () {
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

            it('get chaos experiments with wrong context_id should no processors', async function () {
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
                const chaosExperimentIds = chaosExperimentsInserted.map(processor => processor.body.id);
                for (const chaosExperimentId of chaosExperimentIds) {
                    await chaosExperimentsRequestSender.deleteChaosExperiment(chaosExperimentId, { 'Content-Type': 'application/json' });
                }
            });
        });
        describe('DELETE /v1/chaos-experiments/{experiment_id}', () => {
            let chaosExperimentResponse, experimentId;
            beforeEach(async function () {
                const chaosExperiment = generateRawChaosExperiment(uuid.v4(), contextId);
                const headersWithContext = Object.assign({}, validHeaders, { 'x-context-id': contextId });

                chaosExperimentResponse = await chaosExperimentsRequestSender.createChaosExperiment(chaosExperiment, headersWithContext);
                experimentId = chaosExperimentResponse.body.id;
            });

            afterEach(async function () {
                await chaosExperimentsRequestSender.deleteChaosExperiment(experimentId, { 'Content-Type': 'application/json' });
            });

            it('insert a processor and then delete it with same context', async () => {
                const headers = {
                    'Content-Type': 'application/json',
                    'x-context-id': contextId
                };

                const deleteResponse = await chaosExperimentsRequestSender.deleteChaosExperiment(experimentId, headers);
                should(deleteResponse.statusCode).equal(204);

                const getChaosExperimentResponse = await chaosExperimentsRequestSender.getChaosExperiment(experimentId, headers);
                should(getChaosExperimentResponse.statusCode).equal(404);
            });
            it('delete a processor with wrong context should return 404', async () => {
                const headers = {
                    'Content-Type': 'application/json',
                    'x-context-id': uuid.v4()
                };

                const deleteResponse = await chaosExperimentsRequestSender.deleteChaosExperiment(experimentId, headers);
                should(deleteResponse.statusCode).equal(404);
            });
        });
        describe('GET /v1/chaos_experiment/{experiment_id}', function () {
            let chaosExperimentResponse, experimentId, headers;
            before(async function () {
                headers = {
                    'Content-Type': 'application/json',
                    'x-context-id': contextId
                };
                const chaosExperiment = generateRawChaosExperiment(uuid.v4(), contextId);
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
    });

    describe('Bad requests', function () {
        describe('POST /v1/chaos-experiments', function () {
            it('Create chaos experiment with no name', async () => {
                const chaosExperiment = generateRawChaosExperiment();
                chaosExperiment.name = undefined;
                const creatChaosExperimentResponse = await chaosExperimentsRequestSender.createChaosExperiment(chaosExperiment, validHeaders);
                creatChaosExperimentResponse.statusCode.should.eql(400);
            });
            it('Create processor with no kubeObject', async () => {
                const chaosExperiment = generateRawChaosExperiment('my-test', contextId);
                chaosExperiment.kubeObject = undefined;
                const creatChaosExperimentResponse = await chaosExperimentsRequestSender.createChaosExperiment(chaosExperiment, validHeaders);
                creatChaosExperimentResponse.statusCode.should.eql(400);
            });
            it('Create a processor with name that already exists', async function () {
                const name = 'test-processor';
                const chaosExperiment = generateRawChaosExperiment(name, contextId);
                const creatChaosExperimentResponse = await chaosExperimentsRequestSender.createChaosExperiment(chaosExperiment, validHeaders);
                should(creatChaosExperimentResponse.statusCode).equal(201);
                const experimentId = creatChaosExperimentResponse.body.id;

                const creatChaosExperimentWithSameNameResponse = await chaosExperimentsRequestSender.createChaosExperiment(chaosExperiment, validHeaders);
                should(creatChaosExperimentWithSameNameResponse.statusCode).equal(400);
                should(creatChaosExperimentWithSameNameResponse.body.message).equal(ERROR_MESSAGES.CHAOS_EXPERIMENT_NAME_ALREADY_EXIST);

                const deleteResponse = await chaosExperimentsRequestSender.deleteChaosExperiment(experimentId);
                should(deleteResponse.statusCode).equal(204);
            });
        });
    });
});

function generateRawChaosExperiment(name, contextId) {
    return {
        name,
        context_id: contextId,
        kubeObject:
            {
                kind: 'PodChaos',
                apiVersion: 'chaos-mesh.org/v1alpha1',
                metadata: {
                    namespace: 'apps',
                    name: `${name}`,
                    annotations: {
                        'kubectl.kubernetes.io/last-applied-configuration': '{"apiVersion":"chaos-mesh.org/v1alpha1","kind":"PodChaos","metadata":{"annotations":{},"name":"pod-fault-keren3","namespace":"apps"},"spec":{"action":"pod-kill","duration":"1m","mode":"all","selector":{"labelSelectors":{"app":"live-balances-api"},"namespaces":["apps"]}}}\n'
                    }
                },
                spec: {
                    selector: {
                        namespaces: [
                            'apps'
                        ],
                        labelSelectors: {
                            app: 'live-balances-api'
                        }
                    },
                    mode: 'all',
                    action: 'pod-kill',
                    duration: '1m'
                }
            }
    };
}
