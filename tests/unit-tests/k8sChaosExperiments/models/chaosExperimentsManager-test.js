'use strict';
const should = require('should');
const sinon = require('sinon');
const uuid = require('uuid');

const database = require('../../../../src/chaos-experiments/models/database/databaseConnector');
const manager = require('../../../../src/chaos-experiments/models/chaosExperimentsManager');
const chaosExperimentConnector = require('../../../../src/chaos-experiments/models/kubernetes/chaosExperimentConnector');
const configManager = require('../../../../src/configManager/models/configHandler');

describe('Chaos experiments manager tests', function () {
    let sandbox;
    let deleteStub;
    let getChaosExperimentByNameStub;
    let getChaosExperimentsStub;
    let getChaosExperimentsByIdsStub;
    let updatedChaosExperimentStub;
    let insertStub;
    let setChaosJobExperimentTriggeredStub;
    let runChaosExperimentConnectorStub;
    let getFutureJobExperimentsStub;
    let getChaosExperimentByIdStub;
    let getChaosJobExperimentsByJobIdStub;
    let deleteAllResourcesOfKindAndJobStub;
    let getConfigValueStub;

    before(() => {
        sandbox = sinon.sandbox.create();
        insertStub = sandbox.stub(database, 'insertChaosExperiment');
        getChaosExperimentByIdStub = sandbox.stub(database, 'getChaosExperimentById');
        getChaosExperimentByNameStub = sandbox.stub(database, 'getChaosExperimentByName');
        getChaosExperimentsStub = sandbox.stub(database, 'getAllChaosExperiments');
        getChaosExperimentsByIdsStub = sandbox.stub(database, 'getChaosExperimentsByIds');
        deleteStub = sandbox.stub(database, 'deleteChaosExperiment');
        updatedChaosExperimentStub = sandbox.stub(database, 'updateChaosExperiment');
        setChaosJobExperimentTriggeredStub = sandbox.stub(database, 'setChaosJobExperimentTriggered');
        runChaosExperimentConnectorStub = sandbox.stub(chaosExperimentConnector, 'runChaosExperiment');
        getFutureJobExperimentsStub = sandbox.stub(database, 'getFutureJobExperiments');
        getChaosJobExperimentsByJobIdStub = sandbox.stub(database, 'getChaosJobExperimentsByJobId');
        deleteAllResourcesOfKindAndJobStub = sandbox.stub(chaosExperimentConnector, 'deleteAllResourcesOfKindAndJob');
        getConfigValueStub = sandbox.stub(configManager, 'getConfigValue');
    });
    after(() => {
        sandbox.restore();
    });

    beforeEach(async() => {
        getConfigValueStub.resolves('KUBERNETES');
        await manager.setPlatform();
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
    describe('Get multiple chaos experiments by ids', function () {
        it('Database returns empty row array, should return empty array', async function () {
            getChaosExperimentsByIdsStub.resolves([]);
            const experiments = await manager.getChaosExperimentsByIds();
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
                getChaosExperimentsByIdsStub.resolves([
                    firstExperiment,
                    secondExperiment
                ]);
            });
            it('Database returns two rows array, should return two experiments', async function () {
                const experiments = await manager.getChaosExperimentsByIds(['1234', '4321']);
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
                id: '11111',
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
    describe('Run chaos experiment', function () {
        const kubernetesJobConfig = {
            kind: 'PodChaos',
            apiVersion: 'chaos-mesh.org/v1alpha1',
            metadata: {
                namespace: 'apps',
                name: 'first pod fault',
                annotations: {}
            },
            spec: {
                selector: {
                    namespaces: ['apps'],
                    labelSelectors: {
                        app: 'live-balances-api'
                    },
                    mode: 'all',
                    action: 'pod-chaos',
                    duration: '1m'
                }
            }
        };
        const chaosJobExperimentId = uuid();
        const jobId = uuid();
        it('should call k8s connector and write to db', async function() {
            const mappedChaosExperiment = {
                ...kubernetesJobConfig,
                metadata: {
                    ...kubernetesJobConfig.metadata,
                    labels: {
                        app: 'predator',
                        job_id: jobId
                    }
                }
            };

            await manager.runChaosExperiment(chaosJobExperimentId, jobId, chaosJobExperimentId);
            runChaosExperimentConnectorStub.calledOnce.should.eql(true);
            runChaosExperimentConnectorStub.args[0][0].should.eql(mappedChaosExperiment);
            setChaosJobExperimentTriggeredStub.calledOnce.should.eql(true);
        });
    });

    describe('Reload job experiments', function () {
        it('found future experiments to reload', async () => {
            const timestamp = 500;
            const jobId = '1234';
            const kubeObject = { hello: 1 };
            const mappedKubeObject = { ...kubeObject, metadata: { labels: { app: 'predator', job_id: jobId } } };
            const jobExperiment = { start_time: timestamp, job_id: jobId, experiment_id: '4321', id: '2468' };
            const chaosExperiment = { kubeObject: kubeObject, experiment_id: '4321' };
            getFutureJobExperimentsStub.resolves([jobExperiment]);
            getChaosExperimentByIdStub.resolves(chaosExperiment);
            runChaosExperimentConnectorStub.returns();

            const clock = sinon.useFakeTimers();
            clock.tick(1000);
            await manager.reloadChaosExperiments();
            clock.tick(3000);
            sinon.assert.calledOnce(runChaosExperimentConnectorStub);
            sinon.assert.calledWith(runChaosExperimentConnectorStub, mappedKubeObject);
            clock.restore();
        });
        it('future experiments not found - nothing to reload', async () => {
            getFutureJobExperimentsStub.resolves([]);
            runChaosExperimentConnectorStub.returns();
            await manager.reloadChaosExperiments();
            sinon.assert.notCalled(getChaosExperimentByIdStub);
            sinon.assert.notCalled(runChaosExperimentConnectorStub);
        });
    });

    describe('stop job experiments by job id', function () {
        it('should stop relevant experiments', async () => {
            const jobId = uuid();
            const firstExId = uuid();
            const secondExId = uuid();
            const thirdExId = uuid();
            const firstExperiment = {
                id: firstExId,
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

            const secondExperiment = {
                id: secondExId,
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
            getChaosJobExperimentsByJobIdStub.resolves([{
                jobId,
                experiment_id: firstExId,
                start_time: Date.now()
            }, {

                jobId,
                experiment_id: secondExId,
                start_time: Date.now()
            }, {

                jobId,
                experiment_id: thirdExId,
                start_time: Date.now() + 10000
            }
            ]);
            getChaosExperimentsByIdsStub.resolves([
                firstExperiment,
                secondExperiment
            ]);
            await manager.stopJobExperimentsByJobId(jobId);
            sinon.assert.calledOnce(getChaosJobExperimentsByJobIdStub);
            sinon.assert.calledWith(getChaosJobExperimentsByJobIdStub, jobId);
            sinon.assert.calledOnce(getChaosExperimentsByIdsStub);
            sinon.assert.calledWith(getChaosExperimentsByIdsStub, [firstExId, secondExId]);
            // sinon.assert.calledOnce(deleteAllResourcesOfKindAndJobStub);
            sinon.assert.calledWith(deleteAllResourcesOfKindAndJobStub, 'PodChaos', 'apps', jobId);
        });
    });
});
