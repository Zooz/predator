// const should = require('should');
const sinon = require('sinon');
const rewire = require('rewire');
const requestSender = require('../../../../../src/common/requestSender');
const chaosExperimentConnector = rewire('../../../../../src/chaos-experiments/models/kubernetes/chaosExperimentConnector');

const getSupportedKinds = chaosExperimentConnector.__get__('getSupportedKinds');
const deleteResourcesOfKind = chaosExperimentConnector.__get__('deleteResourcesOfKind');
const getAllResourcesOfKind = chaosExperimentConnector.__get__('getAllResourcesOfKind');
const clearAllFinishedResources = chaosExperimentConnector.__get__('clearAllFinishedResources');
describe('Chaos experiments kubernetes connector tests', function () {
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
            const expectedResponse = [
                {
                 spec:{
                    group: 'chaos-mesh.org',
                    plural: 'podchaos'
                 }   
                },
                {
                    spec:{
                       group: 'chaos-mesh.org',
                       plural: 'httpchaos'
                    }   
                   },
                   {
                    spec:{
                       group: 'some-test.org',
                       plural: 'testchaos'
                    }   
                   },
            ]
            requestSenderSendStub.resolves(expectedResponse);
            const response = await getSupportedKinds();
            response.should.eql(['podchaos','httpchaos']);
        });
    });

    describe.only('Get all resources of a kind', function () {
        it('Should get all resources of kind podchaos', async function () {
            const expectedResponse = [
                {
                 spec:{
                    group: 'chaos-mesh.org',
                    plural: 'podchaos'
                 }   
                },
                {
                    spec:{
                       group: 'chaos-mesh.org',
                       plural: 'httpchaos'
                    }   
                   },
            ]
            requestSenderSendStub.resolves(expectedResponse);
            const response = await getAllResourcesOfKind('podchaos');
            requestSenderSendStub.args[0][0].should.eql({
                url: 'localhost:80/apis/chaos-mesh.org/v1alpha1/podchaos',
                method: 'GET',
                headers: {}
            });
            response.should.eql(expectedResponse);
        });
    });

    describe('Delete resource of a kind', function () {
        it('Should successfully delete specified resource', async function () {
            await deleteResourcesOfKind('podchaos','test1');
            requestSenderSendStub.args[0][0].should.eql({
                url: 'localhost:80/apis/chaos-mesh.org/v1alpha1/podchaos/test1',
                method: 'DELETE',
                headers: {}
            });
        });
    });
    describe('Clear all finished resources', function () {
        it('Should successfully delete specified resource', async function () {
            await deleteResourcesOfKind('podchaos','test1');
            requestSenderSendStub.args[0][0].should.eql({
                url: 'localhost:80/apis/chaos-mesh.org/v1alpha1/podchaos/test1',
                method: 'DELETE',
                headers: {}
            });
        });
    });
});
