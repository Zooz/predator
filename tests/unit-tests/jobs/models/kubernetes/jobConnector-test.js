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
        jobConnector.__set__('kubernetesUrl', 'localhost:8080');
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
                url: 'localhost:8080/apis/batch/v1/namespaces/default/jobs',
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
                url: 'localhost:8080/apis/batch/v1/namespaces/default/jobs/jobPlatformName-runId',
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
});