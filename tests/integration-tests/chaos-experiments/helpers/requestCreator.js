
const request = require('supertest');

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
        const appInitUtils = require('../../testUtils');
        app = await appInitUtils.getCreateTestApp();
    } catch (err){
        console.log(err);
        process.exit(1);
    }
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
