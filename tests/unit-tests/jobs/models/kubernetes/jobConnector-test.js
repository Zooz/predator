'use strict';
let should = require('should');
let sinon = require('sinon');
let rewire = require('rewire');
let requestSender = require('../../../../../src/common/requestSender');
let config = require('../../../../../src/config/kubernetesConfig');
config.kubernetesNamespace = 'default';
let jobConnector = rewire('../../../../../src/jobs/models/kubernetes/jobConnector');

describe('Kubernetes job connector tests', function () {
    let sandbox;
    let requestSenderSendStub;

    before(() => {
        jobConnector.__set__('kubernetesUrl', 'localhost:80');
        sandbox = sinon.sandbox.create();
        requestSenderSendStub = sandbox.stub(requestSender, 'send');
    });

    beforeEach(() => {
        sandbox.resetHistory();
    });

    after(() => {
        sandbox.restore();
    });

    describe('Run new job', () => {
        it('Success to create a job and running it immediately', async () => {
            requestSenderSendStub.resolves({ metadata: { name: 'Predator', uid: 'some_uuid' }, namespace: 'default' });
            let jobResponse = await jobConnector.runJob({ metadata: { name: 'predator' } });
            jobResponse.should.eql({
                'id': 'some_uuid',
                'jobName': 'Predator',
                'namespace': 'default'
            });
            requestSenderSendStub.callCount.should.eql(1);
            requestSenderSendStub.args[0][0].should.eql({
                url: 'localhost:80/apis/batch/v1/namespaces/default/jobs',
                method: 'POST',
                body: { metadata: { name: 'predator' } },
                headers: {}
            });
        });

        it('Fail to create a job', async () => {
            requestSenderSendStub.rejects(new Error('Error deploying job'));

            try {
                await jobConnector.runJob({ metadata: { name: 'predator' } });
                throw new Error('Should not get here');
            } catch (error) {
                error.should.eql(new Error('Error deploying job'));
            }
        });
    });

    describe('Stop running job', () => {
        it('Stop a running run of specific job', async () => {
            requestSenderSendStub.resolves({ statusCode: 200 });
            await jobConnector.stopRun('jobPlatformName', 'runId');
            requestSenderSendStub.calledOnce.should.eql(true);
            requestSenderSendStub.args[0][0].should.eql({
                url: 'localhost:80/apis/batch/v1/namespaces/default/jobs/jobPlatformName-runId?propagationPolicy=Foreground',
                method: 'DELETE',
                headers: {}
            });
        });

        it('Failure Stopping a running run of specific job', async () => {
            requestSenderSendStub.rejects(new Error('timeout'));
            try {
                await jobConnector.stopRun('jobPlatformName');
                throw new Error('Should not get here');
            } catch (error) {
                error.message.should.eql('timeout');
            }
        });
    });

    describe('Get logs', () => {
        it('Get logs of specific job', async () => {
            requestSenderSendStub.withArgs(sinon.match({ url: 'localhost:80/apis/batch/v1/namespaces/default/jobs/jobPlatformName-runId' })).resolves({
                spec: { selector: { matchLabels: { 'controller-uid': 'uid' } } }
            });
            requestSenderSendStub.withArgs(sinon.match({ url: 'localhost:80/api/v1/namespaces/default/pods?labelSelector=controller-uid=uid' })).resolves({
                items: [{ metadata: { name: 'podA' } }, { metadata: { name: 'podB' } }]
            });
            requestSenderSendStub.withArgs(sinon.match({ url: 'localhost:80/api/v1/namespaces/default/pods/podA/log?container=predator-runner' })).resolves('aLog');

            requestSenderSendStub.withArgs(sinon.match({ url: 'localhost:80/api/v1/namespaces/default/pods/podB/log?container=predator-runner' })).resolves('bLog');

            let logs = await jobConnector.getLogs('jobPlatformName', 'runId');

            logs.should.eql([{ type: 'file', name: 'podA.txt', content: 'aLog' },
                { type: 'file', name: 'podB.txt', content: 'bLog' }]);
        });

        it('Get logs fails due to error in kubernetes', async () => {
            requestSenderSendStub
                .withArgs(sinon.match({ url: 'localhost:80/apis/batch/v1/namespaces/default/jobs/jobPlatformName-runId' }))
                .rejects(new Error('Error in kubernetes'));
            try {
                await jobConnector.getLogs('jobPlatformName', 'runId');
                throw new Error('Should not get here');
            } catch (error) {
                error.message.should.eql('Error in kubernetes');
            }
        });
    });
});