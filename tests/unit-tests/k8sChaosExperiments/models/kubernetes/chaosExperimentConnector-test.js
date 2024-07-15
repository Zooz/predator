// const should = require('should');
const sinon = require('sinon');
const rewire = require('rewire');
const requestSender = require('../../../../../src/common/requestSender');
const chaosExperimentConnector = rewire('../../../../../src/chaos-experiments/models/kubernetes/chaosExperimentConnector');

const getSupportedKinds = chaosExperimentConnector.__get__('getSupportedKinds');
const deleteResourceOfKind = chaosExperimentConnector.__get__('deleteResourceOfKind');
const getAllResourcesOfKind = chaosExperimentConnector.__get__('getAllResourcesOfKind');
describe('Chaos experiments kubernetes connector tests', function () {
    let sandbox;
    let requestSenderSendStub, getAllResourcesOfKindStub, deleteResourceOfKindStub;
    before(() => {
        sandbox = sinon.sandbox.create();
        requestSenderSendStub = sandbox.stub(requestSender, 'send');
        getAllResourcesOfKindStub = sandbox.stub();
        deleteResourceOfKindStub = sandbox.stub();
        chaosExperimentConnector.__set__('kubernetesUrl', 'localhost:80');
        chaosExperimentConnector.__set__('kubernetesNamespace', 'default');
    });
    after(() => {
        sandbox.restore();
    });

    beforeEach(() => {
        sandbox.reset();
    });
    describe('Run chaos experiment', function () {
        beforeEach(() => {
            sandbox.reset();
        });
        it('Should send POST request to pod chaos url', async function () {
            const kubernetesJobConfig = {
                kind: 'PodChaos',
                apiVersion: 'chaos-mesh.org/v1alpha1',
                metadata: {
                    namespace: 'apps',
                    name: 'firstPodChaos',
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
            requestSenderSendStub.resolves({ metadata: { name: 'firstPodChaos', uid: 'some_uuid' }, namespace: 'apps' });
            await chaosExperimentConnector.runChaosExperiment(kubernetesJobConfig);
            requestSenderSendStub.callCount.should.eql(1);
            requestSenderSendStub.args[0][0].should.eql({
                url: 'localhost:80/apis/chaos-mesh.org/v1alpha1/namespaces/apps/podchaos',
                method: 'POST',
                body: kubernetesJobConfig,
                headers: {}
            });
        });

        it('Should send POST request to http chaos url', async function () {
            const kubernetesJobConfig = {
                kind: 'HttpChaos',
                apiVersion: 'chaos-mesh.org/v1alpha1',
                metadata: {
                    namespace: 'apps',
                    name: 'firstHttpChaos',
                    annotations: {}
                },
                spec: {
                    selector: {
                        namespaces: ['apps'],
                        labelSelectors: {
                            app: 'live-balances-api'
                        },
                        mode: 'all',
                        action: 'http-kill',
                        duration: '1m'
                    }
                }
            };
            requestSenderSendStub.resolves({ metadata: { name: 'firstHttpChaos', uid: 'some_uuid' }, namespace: 'apps' });
            await chaosExperimentConnector.runChaosExperiment(kubernetesJobConfig);
            requestSenderSendStub.callCount.should.eql(1);
            requestSenderSendStub.args[0][0].should.eql({
                url: 'localhost:80/apis/chaos-mesh.org/v1alpha1/namespaces/apps/httpchaos',
                method: 'POST',
                body: kubernetesJobConfig,
                headers: {}
            });
        });
    });
    describe('Get supported kinds', function () {
        it('Should successfully get supported kinds', async function () {
            const expectedResponse = {
                items: [
                    {
                        spec: {
                            group: 'chaos-mesh.org',
                            names: {
                                plural: 'podchaos'
                            }
                        }
                    },
                    {
                        spec: {
                            group: 'chaos-mesh.org',
                            names: {
                                plural: 'httpchaos'
                            }
                        }
                    },
                    {
                        spec: {
                            group: 'some-test.org',
                            names: {
                                plural: 'testchaos'
                            }
                        }
                    }
                ]
            };
            requestSenderSendStub.resolves(expectedResponse);
            const response = await getSupportedKinds();
            response.should.eql(['podchaos', 'httpchaos']);
        });
    });

    describe('Get all resources of a kind', function () {
        it('Should get all resources of kind podchaos', async function () {
            const expectedResponse = {
                items: [
                    {
                        spec: {
                            group: 'chaos-mesh.org',
                            names: {
                                plural: 'podchaos'
                            }
                        }
                    },
                    {
                        spec: {
                            group: 'chaos-mesh.org',
                            names: {
                                plural: 'httpchaos'
                            }
                        }
                    }
                ]
            };
            requestSenderSendStub.resolves(expectedResponse);
            const response = await getAllResourcesOfKind('podchaos');
            requestSenderSendStub.args[0][0].should.eql({
                url: 'localhost:80/apis/chaos-mesh.org/v1alpha1/podchaos',
                method: 'GET',
                headers: {}
            });
            response.should.eql(expectedResponse.items);
        });
    });

    describe('Delete all resources of a kind and job', function () {
        it('Should successfully delete all relevant resources', async function () {
            await chaosExperimentConnector.deleteAllResourcesOfKindAndJob('podchaos', 'apps', 'test1');
            requestSenderSendStub.args[0][0].should.eql({
                url: 'localhost:80/apis/chaos-mesh.org/v1alpha1/namespaces/apps/podchaos?labelSelector=predator/job-id=test1',
                method: 'DELETE',
                headers: {}
            });
        });
    });
    describe('Clear all finished resources', function () {
        before(() => {
            chaosExperimentConnector.__set__('getAllResourcesOfKind', getAllResourcesOfKindStub);
            chaosExperimentConnector.__set__('deleteResourceOfKind', deleteResourceOfKindStub);
            chaosExperimentConnector.__set__('supportedChaosKinds', ['podchaos', 'httpchaos']);
        });
        after(() => {
            chaosExperimentConnector.__set__('getAllResourcesOfKind', getAllResourcesOfKind);
            chaosExperimentConnector.__set__('deleteResourceOfKind', deleteResourceOfKind);
        });
        describe('When all resources are stopped', function () {
            it('Should delete all 4 resources', async function () {
                getAllResourcesOfKindStub.withArgs('podchaos').returns(
                    [
                        {
                            metadata: {
                                name: 'test1',
                                namespace: 'apps'
                            },
                            spec: {
                                group: 'chaos-mesh.org',
                                plural: 'podchaos'
                            },
                            status: {
                                experiment: {
                                    desiredPhase: 'Stop'
                                }
                            }
                        },
                        {
                            metadata: {
                                name: 'test2',
                                namespace: 'apps'
                            },
                            spec: {
                                group: 'chaos-mesh.org',
                                plural: 'podchaos'
                            },
                            status: {
                                experiment: {
                                    desiredPhase: 'Stop'
                                }
                            }
                        }
                    ]);
                getAllResourcesOfKindStub.withArgs('httpchaos').returns(
                    [
                        {
                            metadata: {
                                name: 'second1',
                                namespace: 'apps'
                            },
                            spec: {
                                group: 'chaos-mesh.org',
                                plural: 'httpchaos'
                            },
                            status: {
                                experiment: {
                                    desiredPhase: 'Stop'
                                }
                            }
                        },
                        {
                            metadata: {
                                name: 'second2',
                                namespace: 'apps'
                            },
                            spec: {
                                group: 'chaos-mesh.org',
                                plural: 'httpchaos'
                            },
                            status: {
                                experiment: {
                                    desiredPhase: 'Stop'
                                }
                            }
                        }
                    ]);
                const deletedCount = await chaosExperimentConnector.clearAllFinishedResources();
                getAllResourcesOfKindStub.callCount.should.eql(2);
                getAllResourcesOfKindStub.args.should.eql([['podchaos'], ['httpchaos']]);
                deletedCount.should.eql(4);
                deleteResourceOfKindStub.callCount.should.eql(4);
            });
        });
        describe('When 2 experiments are stopped and 2 are running', function () {
            it('Should delete 2 stopped resources', async function () {
                getAllResourcesOfKindStub.withArgs('podchaos').returns(
                    [
                        {
                            metadata: {
                                name: 'test1',
                                namespace: 'apps'
                            },
                            spec: {
                                group: 'chaos-mesh.org',
                                plural: 'podchaos'
                            },
                            status: {
                                experiment: {
                                    desiredPhase: 'Run'
                                }
                            }
                        },
                        {
                            metadata: {
                                name: 'test2',
                                namespace: 'apps'
                            },
                            spec: {
                                group: 'chaos-mesh.org',
                                plural: 'podchaos'
                            },
                            status: {
                                experiment: {
                                    desiredPhase: 'Stop'
                                }
                            }
                        }
                    ]);
                getAllResourcesOfKindStub.withArgs('httpchaos').returns(
                    [
                        {
                            metadata: {
                                name: 'second1',
                                namespace: 'apps'
                            },
                            spec: {
                                group: 'chaos-mesh.org',
                                plural: 'httpchaos'
                            },
                            status: {
                                experiment: {
                                    desiredPhase: 'Run'
                                }
                            }
                        },
                        {
                            metadata: {
                                name: 'second2',
                                namespace: 'apps'
                            },
                            spec: {
                                group: 'chaos-mesh.org',
                                plural: 'httpchaos'
                            },
                            status: {
                                experiment: {
                                    desiredPhase: 'Stop'
                                }
                            }
                        }
                    ]);
                await chaosExperimentConnector.clearAllFinishedResources();
                deleteResourceOfKindStub.args.should.eql([['podchaos', 'test2', 'apps'], ['httpchaos', 'second2', 'apps']]);
                deleteResourceOfKindStub.callCount.should.eql(2);
            });
        });
    });
});
