'use strict';
const should = require('should');
const sinon = require('sinon');
const rewire = require('rewire');
const requestSender = require('../../../../../src/common/requestSender');
const jobExperimentsHandler = require('../../../../../src/jobs/models/kubernetes/jobExperimentsHandler');
const config = require('../../../../../src/config/kubernetesConfig');
config.kubernetesNamespace = 'default';
const jobConnector = rewire('../../../../../src/jobs/models/kubernetes/jobConnector');

describe('Kubernetes job connector tests', function () {
    let sandbox;
    let requestSenderSendStub;
    let getChaosExperimentHandlerStub;
    let stopChaosExperimentsForJobStub;
    let clearAllFinishedJobExperimentsStub;

    before(() => {
        jobConnector.__set__('kubernetesUrl', 'localhost:80');
        sandbox = sinon.sandbox.create();
        requestSenderSendStub = sandbox.stub(requestSender, 'send');
        getChaosExperimentHandlerStub = sandbox.stub(jobExperimentsHandler, 'setChaosExperimentsIfExist');
        stopChaosExperimentsForJobStub = sandbox.stub(jobExperimentsHandler, 'stopChaosExperimentsForJob');
        clearAllFinishedJobExperimentsStub = sandbox.stub(jobExperimentsHandler, 'clearAllFinishedJobExperiments');
    });

    beforeEach(() => {
        sandbox.reset();
    });

    after(() => {
        sandbox.restore();
    });

    describe('Run new job', () => {
        it('Success to create a job and running it immediately', async () => {
            requestSenderSendStub.resolves({ metadata: { name: 'Predator', uid: 'some_uuid' }, namespace: 'default' });
            const job = { id: 'test_id' };
            const jobResponse = await jobConnector.runJob({ metadata: { name: 'predator' } }, job);
            jobResponse.should.eql({
                id: 'some_uuid',
                jobName: 'Predator',
                namespace: 'default'
            });
            requestSenderSendStub.callCount.should.eql(1);
            requestSenderSendStub.args[0][0].should.eql({
                url: 'localhost:80/apis/batch/v1/namespaces/default/jobs',
                method: 'POST',
                body: { metadata: { name: 'predator' } },
                headers: {}
            });
            getChaosExperimentHandlerStub.callCount.should.eql(1);
        });

        it('Success to create a job and running it immediately - with experiments', async () => {
            requestSenderSendStub.resolves({ metadata: { name: 'Predator', uid: 'some_uuid' }, namespace: 'default' });
            getChaosExperimentHandlerStub.resolves();
            const job = { id: 'test_id', experiments: ['abc123'] };
            const jobResponse = await jobConnector.runJob({ metadata: { name: 'predator' } }, job);
            jobResponse.should.eql({
                id: 'some_uuid',
                jobName: 'Predator',
                namespace: 'default'
            });
            requestSenderSendStub.callCount.should.eql(1);
            requestSenderSendStub.args[0][0].should.eql({
                url: 'localhost:80/apis/batch/v1/namespaces/default/jobs',
                method: 'POST',
                body: { metadata: { name: 'predator' } },
                headers: {}
            });
            getChaosExperimentHandlerStub.callCount.should.eql(1);
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
            await jobConnector.stopRun('jobPlatformName', { id: 'jobId' });
            requestSenderSendStub.calledOnce.should.eql(true);
            requestSenderSendStub.args[0][0].should.eql({
                url: 'localhost:80/apis/batch/v1/namespaces/default/jobs/jobPlatformName?propagationPolicy=Foreground',
                method: 'DELETE',
                headers: {}
            });
            stopChaosExperimentsForJobStub.calledOnce.should.eql(true);
        });

        it('Failure Stopping a running run of specific job', async () => {
            requestSenderSendStub.rejects(new Error('timeout'));
            try {
                await jobConnector.stopRun('predator-runner');
                throw new Error('Should not get here');
            } catch (error) {
                error.message.should.eql('timeout');
            }
        });
    });

    describe('Get logs', () => {
        it('Get logs of specific job', async () => {
            requestSenderSendStub.withArgs(sinon.match({ url: 'localhost:80/apis/batch/v1/namespaces/default/jobs/jobPlatformName' })).resolves({
                spec: { selector: { matchLabels: { 'controller-uid': 'uid' } } }
            });
            requestSenderSendStub.withArgs(sinon.match({ url: 'localhost:80/api/v1/namespaces/default/pods?labelSelector=controller-uid=uid' })).resolves({
                items: [{ metadata: { name: 'podA' } }, { metadata: { name: 'podB' } }]
            });
            requestSenderSendStub.withArgs(sinon.match({ url: 'localhost:80/api/v1/namespaces/default/pods/podA/log?container=predator-runner' })).resolves('aLog');

            requestSenderSendStub.withArgs(sinon.match({ url: 'localhost:80/api/v1/namespaces/default/pods/podB/log?container=predator-runner' })).resolves('bLog');

            const logs = await jobConnector.getLogs('jobPlatformName', 'predator-runner');

            logs.should.eql([{ type: 'file', name: 'podA.txt', content: 'aLog' },
                { type: 'file', name: 'podB.txt', content: 'bLog' }]);
        });

        it('Get logs fails due to error in kubernetes', async () => {
            requestSenderSendStub
                .withArgs(sinon.match({ url: 'localhost:80/apis/batch/v1/namespaces/default/jobs/jobPlatformName' }))
                .rejects(new Error('Error in kubernetes'));
            try {
                await jobConnector.getLogs('jobPlatformName');
                throw new Error('Should not get here');
            } catch (error) {
                error.message.should.eql('Error in kubernetes');
            }
        });
    });

    describe('Delete all containers', () => {
        it('Should success delete job', async () => {
            requestSenderSendStub.withArgs(sinon.match({ url: 'localhost:80/apis/batch/v1/namespaces/default/jobs?labelSelector=app=predator-runner' })).resolves({
                items: [{ metadata: { uid: 'x' } }]
            });

            requestSenderSendStub.withArgs(sinon.match({ url: 'localhost:80/api/v1/namespaces/default/pods?labelSelector=controller-uid=x' })).resolves({
                items: [{ metadata: { name: 'podA' } }]
            });

            requestSenderSendStub.withArgs(sinon.match({ url: 'localhost:80/api/v1/namespaces/default/pods/podA' })).resolves({
                metadata: { labels: { 'job-name': 'predator.job' } },
                status: {
                    containerStatuses: [{
                        name: 'predator-runner',
                        state: { terminated: { finishedAt: '2020' } }
                    }, {
                        name: 'podB',
                        state: {}
                    }]
                }

            });
            clearAllFinishedJobExperimentsStub.resolves(3);

            const result = await jobConnector.deleteAllContainers('predator-runner');

            requestSenderSendStub.args[3][0].should.eql({
                url: 'localhost:80/apis/batch/v1/namespaces/default/jobs/predator.job?propagationPolicy=Foreground',
                method: 'DELETE',
                headers: {}
            });

            clearAllFinishedJobExperimentsStub.calledOnce.should.eql(true);

            should(result.deleted).eql(1);
            should(result.internal_resources_deleted).eql({ chaos_mesh: 3 });
        });

        it('Fails due to error in kubernetes', async () => {
            requestSenderSendStub.withArgs(sinon.match({ url: 'localhost:80/apis/batch/v1/namespaces/default/jobs?labelSelector=app=predator-runner' })).rejects(new Error('Error in kubernetes'));

            try {
                await jobConnector.deleteAllContainers('predator-runner');
                throw new Error('Should not get here');
            } catch (error) {
                error.message.should.eql('Error in kubernetes');
            }
        });
    });
});
