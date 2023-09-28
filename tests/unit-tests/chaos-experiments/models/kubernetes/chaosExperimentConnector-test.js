// const should = require('should');
const sinon = require('sinon');
const rewire = require('rewire');
const requestSender = require('../../../../../src/common/requestSender');
const chaosExperimentConnector = rewire('../../../../../src/chaos-experiments/models/kubernetes/chaosExperimentConnector');

describe('Chaos experiments manager tests', function () {
    let sandbox;
    let requestSenderSendStub;
    before(() => {
        sandbox = sinon.sandbox.create();
        requestSenderSendStub = sandbox.stub(requestSender, 'send');
        chaosExperimentConnector.__set__('kubernetesUrl', 'localhost:80');
        chaosExperimentConnector.__set__('kubernetesNamespace', 'default');
    });
    after(() => {
        sandbox.restore();
    });

    beforeEach(() => {
        sandbox.reset();
    });
    it('Should send POST request to pod chaos url', async function () {
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
        requestSenderSendStub.resolves({ metadata: { name: 'firstPodChaos', uid: 'some_uuid' }, namespace: 'default' });
        await chaosExperimentConnector.runChaosExperiment(kubernetesJobConfig);
        requestSenderSendStub.callCount.should.eql(1);
        requestSenderSendStub.args[0][0].should.eql({
            url: 'localhost:80/apis/chaos-mesh.org/v1alpha1/namespaces/default/podchaos',
            method: 'POST',
            body: kubernetesJobConfig,
            headers: {}
        });
    });

    it('Should send POST request to pod chaos url', async function () {
        const kubernetesJobConfig = {
            kind: 'HttpChaos',
            apiVersion: 'chaos-mesh.org/v1alpha1',
            metadata: {
                namespace: 'apps',
                name: 'first http fault',
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
        requestSenderSendStub.resolves({ metadata: { name: 'firstHttpChaos', uid: 'some_uuid' }, namespace: 'default' });
        await chaosExperimentConnector.runChaosExperiment(kubernetesJobConfig);
        requestSenderSendStub.callCount.should.eql(1);
        requestSenderSendStub.args[0][0].should.eql({
            url: 'localhost:80/apis/chaos-mesh.org/v1alpha1/namespaces/default/httpchaos',
            method: 'POST',
            body: kubernetesJobConfig,
            headers: {}
        });
    });
});
