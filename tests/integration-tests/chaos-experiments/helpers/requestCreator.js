
const request = require('supertest');
const nock = require('nock');
const kubernetesConfig = require('../../../../src/config/kubernetesConfig');

let app;

module.exports = {
    init,
    createChaosExperiment,
    getChaosExperiments,
    getChaosExperiment,
    updateChaosExperiment,
    deleteChaosExperiment,
    generateRawChaosExperiment
};

async function init() {
    try {
        nockK8sChaosExperimentSupportedKinds(kubernetesConfig.kubernetesUrl);
        const appInitUtils = require('../../testUtils');
        app = await appInitUtils.getCreateTestApp();
    } catch (err){
        console.log(err);
        process.exit(1);
    }
}

function nockK8sChaosExperimentSupportedKinds(url) {
    const response = {
        kind: 'CustomResourceDefinitionList',
        apiVersion: 'apiextensions.k8s.io/v1',
        metadata: {
            resourceVersion: '123456'
        },
        items: [
            {
                apiVersion: 'apiextensions.k8s.io/v1',
                kind: 'CustomResourceDefinition',
                metadata: {
                    name: 'stresschaos.chaos-mesh.org',
                    uid: 'abcd1234-5678-90ef-ghij-klmn12345678',
                    resourceVersion: '987654',
                    generation: 1,
                    creationTimestamp: '2023-01-01T00:00:00Z',
                    annotations: {
                        'kubectl.kubernetes.io/last-applied-configuration': '...'
                    }
                },
                spec: {
                    group: 'chaos-mesh.org',
                    names: {
                        plural: 'stresschaos',
                        singular: 'stresschaos',
                        kind: 'StressChaos',
                        shortNames: ['sc']
                    },
                    scope: 'Namespaced',
                    versions: [
                        {
                            name: 'v1alpha1',
                            served: true,
                            storage: true,
                            schema: {
                                openAPIV3Schema: {
                                    type: 'object',
                                    properties: {
                                        // schema details
                                    }
                                }
                            }
                        }
                    ]
                },
                status: {
                    conditions: [
                        {
                            type: 'NamesAccepted',
                            status: 'True',
                            lastTransitionTime: '2023-01-01T00:00:00Z',
                            reason: 'NoConflicts',
                            message: 'No conflicts found'
                        },
                        {
                            type: 'Established',
                            status: 'True',
                            lastTransitionTime: '2023-01-01T00:00:00Z',
                            reason: 'InitialNamesAccepted',
                            message: 'The CRD has been successfully established'
                        }
                    ]
                }
            },
            {
                apiVersion: 'apiextensions.k8s.io/v1',
                kind: 'CustomResourceDefinition',
                metadata: {
                    name: 'podchaos.chaos-mesh.org',
                    uid: 'efgh5678-1234-abcd-ijkl-901234567890',
                    resourceVersion: '876543',
                    generation: 1,
                    creationTimestamp: '2023-01-01T00:00:00Z',
                    annotations: {
                        'kubectl.kubernetes.io/last-applied-configuration': '...'
                    }
                },
                spec: {
                    group: 'chaos-mesh.org',
                    names: {
                        plural: 'podchaos',
                        singular: 'podchaos',
                        kind: 'PodChaos',
                        shortNames: ['pc']
                    },
                    scope: 'Namespaced',
                    versions: [
                        {
                            name: 'v1alpha1',
                            served: true,
                            storage: true,
                            schema: {
                                openAPIV3Schema: {
                                    type: 'object',
                                    properties: {
                                        // schema details
                                    }
                                }
                            }
                        }
                    ]
                },
                status: {
                    conditions: [
                        {
                            type: 'NamesAccepted',
                            status: 'True',
                            lastTransitionTime: '2023-01-01T00:00:00Z',
                            reason: 'NoConflicts',
                            message: 'No conflicts found'
                        },
                        {
                            type: 'Established',
                            status: 'True',
                            lastTransitionTime: '2023-01-01T00:00:00Z',
                            reason: 'InitialNamesAccepted',
                            message: 'The CRD has been successfully established'
                        }
                    ]
                }
            }
            // Additional CRDs can be listed here
        ]
    };

    nock(url).persist()
        .get('/apis/apiextensions.k8s.io/v1/customresourcedefinitions')
        .reply(200, response);
}

function createChaosExperiment(body, headers = { 'Content-Type': 'application/json' }) {
    return request(app).post('/v1/chaos-experiments')
        .send(body)
        .set(headers)
        .expect(function(res){
            return res;
        });
}

function getChaosExperiments(from, limit, exclude, headers = { 'Content-Type': 'application/json' }) {
    return request(app).get('/v1/chaos-experiments')
        .query({ from, limit, exclude })
        .set(headers)
        .expect(function (res) {
            return res;
        });
}

function updateChaosExperiment(experimentId, body, headers = { 'Content-Type': 'application/json' }) {
    return request(app).put(`/v1/chaos-experiments/${experimentId}`)
        .send(body)
        .set(headers)
        .expect(function (res) {
            return res;
        });
}

function deleteChaosExperiment(experimentId, headers = { 'Content-Type': 'application/json' }) {
    return request(app).delete(`/v1/chaos-experiments/${experimentId}`)
        .set(headers)
        .expect(function (res) {
            return res;
        });
}

function getChaosExperiment(experimentId, headers = { 'Content-Type': 'application/json' }) {
    return request(app).get(`/v1/chaos-experiments/${experimentId}`)
        .set(headers)
        .expect(function (res) {
            return res;
        });
}

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
