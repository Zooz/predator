'use strict';
const should = require('should');
const sinon = require('sinon');
const uuid = require('uuid');
const rewire = require('rewire');

const database = require('../../../../src/chaos-experiments/models/database/databaseConnector');
const manager = rewire('../../../../src/chaos-experiments/models/chaosExperimentsManager');

describe('Chaos experiments manager tests', function () {
    let sandbox;
    let deleteStub;
    let getChaosExperimentByIdStub;
    let getChaosExperimentByNameStub;
    let getChaosExperimentsStub;
    let updatedChaosExperimentStub;
    let insertStub;

    before(() => {
        sandbox = sinon.sandbox.create();
        insertStub = sandbox.stub(database, 'insertChaosExperiment');
        getChaosExperimentByIdStub = sandbox.stub(database, 'getChaosExperimentById');
        getChaosExperimentByNameStub = sandbox.stub(database, 'getChaosExperimentByName');
        getChaosExperimentsStub = sandbox.stub(database, 'getAllChaosExperiments');
        deleteStub = sandbox.stub(database, 'deleteChaosExperiment');
        updatedChaosExperimentStub = sandbox.stub(database, 'updateChaosExperiment');
    });

    beforeEach(() => {
        sandbox.reset();
    });

    describe('Create new chaos experiment', function () {
        it('Should save new test to database and return the chaos experiment id', async function () {
            const firstExperiment = {
                kubeObject: {
                    kind: 'PodChaos',
                    apiVersion: 'chaos-mesh.org/v1alpha1',
                    metadata: {
                        namespace: 'apps',
                        name: 'first pod fault',
                        annotations: {}
                    },
                    spec: {}
                },
                name: 'mickey'
            };
            insertStub.resolves();
            getChaosExperimentByNameStub.resolves(null);
            const chaosExperiment = await manager.createChaosExperiment(firstExperiment);
            should(chaosExperiment.id).not.be.empty();
            should(chaosExperiment).containDeep(firstExperiment);
        });

        it('should throw an error of name already exists', async function() {
            const firstExperiment = {
                kubeObject: {
                    kind: 'PodChaos',
                    apiVersion: 'chaos-mesh.org/v1alpha1',
                    metadata: {
                        namespace: 'apps',
                        name: 'first pod fault',
                        annotations: {}
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
                },
                name: 'mickey'
            };

            getChaosExperimentByNameStub.resolves(firstExperiment);
            try {
                await manager.createChaosExperiment(firstExperiment);
                throw new Error('should not get here');
            } catch (e) {
                should(e.statusCode).equal(400);
            }
        });
    });
    describe('Delete existing chaos experiment', function () {
        it('Should delete chaos experiment', async function () {
            const firstExperiment = {
                kubeObject: {
                    kind: 'PodChaos',
                    apiVersion: 'chaos-mesh.org/v1alpha1',
                    metadata: {
                        namespace: 'apps',
                        name: 'first pod fault',
                        annotations: {}
                    },
                    spec: {}
                },
                name: 'mickey'
            };

            getChaosExperimentByIdStub.resolves(firstExperiment);
            deleteStub.resolves();
            const existingChaosExperimentId = uuid();
            await manager.deleteChaosExperiment(existingChaosExperimentId);
            deleteStub.calledOnce.should.eql(true);
        });
    });
    describe('Get single chaos experiment', function () {
        it('Database returns one row, should return the chaos experiment', async function () {
            const firstExperiment = {
                id: '1234',
                kubeObject: {
                    kind: 'PodChaos',
                    apiVersion: 'chaos-mesh.org/v1alpha1',
                    metadata: {
                        namespace: 'apps',
                        name: 'first pod fault',
                        annotations: {}
                    },
                    spec: {}
                },
                name: 'mickey'
            };

            getChaosExperimentByIdStub.resolves(firstExperiment);

            const experiment = await manager.getChaosExperimentById(firstExperiment.id);
            experiment.should.eql(firstExperiment);
        });
        it('Database returns undefined, should throw 404', async function () {
            let exception;
            getChaosExperimentByIdStub.resolves();
            try {
                await manager.getChaosExperimentById(uuid());
            } catch (e) {
                exception = e;
            }
            should(exception.statusCode).eql(404);
            should(exception.message).eql('Not found');
        });
    });
    describe('Get multiple chaos experiments', function () {
        it('Database returns empty row array, should return empty array', async function () {
            getChaosExperimentsStub.resolves([]);
            const experiments = await manager.getAllChaosExperiments();
            experiments.should.eql([]);
        });
        describe('Get multiple chaos experiments with results', function () {
            let firstExperiment, secondExperiment;
            beforeEach(() => {
                firstExperiment = {
                    id: '1234',
                    kubeObject: {
                        kind: 'PodChaos',
                        apiVersion: 'chaos-mesh.org/v1alpha1',
                        metadata: {
                            namespace: 'apps',
                            name: 'first pod fault',
                            annotations: {}
                        },
                        spec: {}
                    },
                    name: 'mickey1'
                };

                secondExperiment = {
                    id: '4321',
                    kubeObject: {
                        kind: 'PodChaos',
                        apiVersion: 'chaos-mesh.org/v1alpha1',
                        metadata: {
                            namespace: 'apps',
                            name: 'first pod fault',
                            annotations: {}
                        },
                        spec: {}
                    },
                    name: 'mickey2'
                };
                getChaosExperimentsStub.resolves([
                    firstExperiment,
                    secondExperiment
                ]);
            });
            it('Database returns two rows array, should return two experiments', async function () {
                const experiments = await manager.getAllChaosExperiments();
                experiments[0].should.have.key('kubeObject');
                experiments[1].should.have.key('kubeObject');
                experiments.should.eql([
                    firstExperiment,
                    secondExperiment
                ]);
            });
        });
    });
    describe('Update chaos experiment', function () {
        const oldExperiment = {
            id: '4321',
            kubeObject: {
                kind: 'PodChaos',
                apiVersion: 'chaos-mesh.org/v1alpha1',
                metadata: {
                    namespace: 'apps',
                    name: 'first pod fault',
                    annotations: {}
                },
                spec: {}
            },
            name: 'mickey'
        };
        it('Should update chaos experiment successfully', async function () {
            const updatedExperiment = {
                id: '4321',
                kubeObject: {
                    kind: 'PodChaos',
                    apiVersion: 'chaos-mesh.org/v1alpha1',
                    metadata: {
                        namespace: 'apps',
                        name: 'second pod fault',
                        annotations: {}
                    },
                    spec: {}
                },
                name: 'mickey2'
            };
            getChaosExperimentByIdStub.resolves(oldExperiment);
            updatedChaosExperimentStub.resolves();

            const experiment = await manager.updateChaosExperiment(oldExperiment.id, updatedExperiment);
            should(experiment).containDeep(updatedExperiment);
        });
        it('Should fail to update chaos experiment - experiment does not exist', async function () {
            let exception;
            const updatedExperiment = {
                id: '4321',
                kubeObject: {
                    kind: 'PodChaos',
                    apiVersion: 'chaos-mesh.org/v1alpha1',
                    metadata: {
                        namespace: 'apps',
                        name: 'second pod fault',
                        annotations: {}
                    },
                    spec: {}
                },
                name: 'mickey2'
            };
            getChaosExperimentByIdStub.resolves();
            try {
                await manager.updateChaosExperiment(oldExperiment.id, updatedExperiment);
            } catch (e) {
                exception = e;
            }
            should(exception.statusCode).eql(404);
            should(exception.message).eql('Not found');
        });
        it('should fail - updating a chaos experiment name to another existing experiment name', async function() {
            const updatedExperiment = {
                id: '4321',
                kubeObject: {
                    kind: 'PodChaos',
                    apiVersion: 'chaos-mesh.org/v1alpha1',
                    metadata: {
                        namespace: 'apps',
                        name: 'second pod fault',
                        annotations: {}
                    },
                    spec: {}
                },
                name: 'mickey2'
            };
            getChaosExperimentByIdStub.resolves(oldExperiment);
            getChaosExperimentByNameStub.resolves(updatedExperiment);
            try {
                await manager.updateChaosExperiment(oldExperiment.id, updatedExperiment);
                throw new Error('should not get here');
            } catch (err) {
                should(err.statusCode).equal(400);
            }
        });
    });
});
