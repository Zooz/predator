'use strict';
let should = require('should');
let sinon = require('sinon');
let rewire = require('rewire');
let requestSender = require('../../../../../src/common/requestSender');
let config = require('../../../../../src/config/serviceConfig');
config.kubernetesNamespace = 'default';
let jobConnector = rewire('../../../../../src/jobs/models/metronome/jobConnector');

describe('Metronome job connector tests', function () {
    let sandbox;
    let requestSenderSendStub;

    before(() => {
        jobConnector.__set__('metronomeUrl', 'localhost:8080');
        sandbox = sinon.sandbox.create();
        requestSenderSendStub = sandbox.stub(requestSender, 'send');
    });

    beforeEach(() => {
        sandbox.reset();
    });

    after(() => {
        sandbox.restore();
    });

    describe('Run a job', () => {
        it('Success to create a job and running it, no job with id the exists', async () => {
            requestSenderSendStub.withArgs(sinon.match({ method: 'GET' })).rejects({ statusCode: 404 });
            requestSenderSendStub.withArgs(sinon.match({ method: 'POST' }))
                .onCall(0)
                .resolves({ id: 'predator.d651ba1d-79fa-4970-b078-6f9dc4ae43e6' })
                .onCall(1)
                .resolves({ id: '20190115084416zH0Ta' });

            let jobResponse = await jobConnector.runJob({ id: 'predator.id' });

            jobResponse.should.eql({
                'id': '20190115084416zH0Ta',
                'jobName': 'predator.d651ba1d-79fa-4970-b078-6f9dc4ae43e6'
            });

            requestSenderSendStub.callCount.should.eql(3);
            requestSenderSendStub.args[0][0].should.eql({
                'headers': {},
                'method': 'GET',
                'url': 'localhost:8080/v1/jobs/predator.id'
            });
            requestSenderSendStub.args[1][0].should.eql({
                'body': {
                    'id': 'predator.id'
                },
                'headers': {},
                'method': 'POST',
                'url': 'localhost:8080/v1/jobs'
            });
            requestSenderSendStub.args[2][0].should.eql({
                'headers': {},
                'method': 'POST',
                'url': 'localhost:8080/v1/jobs/predator.id/runs'
            });
        });

        it('Success to create a job and running it, job already exists, just update it and run', async () => {
            requestSenderSendStub.withArgs(sinon.match({ method: 'GET' })).resolves({});
            requestSenderSendStub.withArgs(sinon.match({ method: 'PUT' })).resolves({ id: 'predator.d651ba1d-79fa-4970-b078-6f9dc4ae43e6' });
            requestSenderSendStub.withArgs(sinon.match({ method: 'POST' })).resolves({ id: '20190115084416zH0Ta' });

            let jobResponse = await jobConnector.runJob({ id: 'predator.id' });

            jobResponse.should.eql({
                'id': '20190115084416zH0Ta',
                'jobName': 'predator.d651ba1d-79fa-4970-b078-6f9dc4ae43e6'
            });

            requestSenderSendStub.callCount.should.eql(3);
            requestSenderSendStub.args[0][0].should.eql({
                'headers': {},
                'method': 'GET',
                'url': 'localhost:8080/v1/jobs/predator.id'
            });
            requestSenderSendStub.args[1][0].should.eql({
                'body': {
                    'id': 'predator.id'
                },
                'headers': {},
                'method': 'PUT',
                'url': 'localhost:8080/v1/jobs/predator.id'
            });
            requestSenderSendStub.args[2][0].should.eql({
                'headers': {},
                'method': 'POST',
                'url': 'localhost:8080/v1/jobs/predator.id/runs'
            });
        });

        describe('Fail to run job', () => {
            it('Fail to POST new job', async () => {
                requestSenderSendStub.withArgs(sinon.match({ method: 'GET' })).rejects({ statusCode: 404 });
                requestSenderSendStub.withArgs(sinon.match({ method: 'POST' })).rejects(new Error('Metronome Error'));

                try {
                    await jobConnector.runJob({ id: 'predator.id' });
                    throw new Error('Should not get here');
                } catch (error) {
                    error.message.should.eql('Metronome Error');
                }
            });

            it('Fail to PUT existing job', async () => {
                requestSenderSendStub.withArgs(sinon.match({ method: 'GET' })).resolves();
                requestSenderSendStub.withArgs(sinon.match({ method: 'PUT' })).rejects(new Error('Metronome Error'));

                try {
                    await jobConnector.runJob({ id: 'predator.id' });
                    throw new Error('Should not get here');
                } catch (error) {
                    error.message.should.eql('Metronome Error');
                }
            });

            it('Fail to run job', async () => {
                requestSenderSendStub.withArgs(sinon.match({ method: 'GET' })).resolves({});
                requestSenderSendStub.withArgs(sinon.match({ method: 'PUT' })).resolves({ id: 'predator.d651ba1d-79fa-4970-b078-6f9dc4ae43e6' });
                requestSenderSendStub.withArgs(sinon.match({ method: 'POST' })).rejects(new Error('Metronome run job error'));

                try {
                    await jobConnector.runJob({ id: 'predator.id' });
                    throw new Error('Should not get here');
                } catch (error) {
                    error.message.should.eql('Metronome run job error');
                }
            });
        });

        describe('Stop running job', () => {
            it('Stop a running run of specific job', async () => {
                requestSenderSendStub.resolves({ statusCode: 200 });
                await jobConnector.stopRun('jobPlatformName', 'runId');
                requestSenderSendStub.calledOnce.should.eql(true);
                requestSenderSendStub.args[0][0].should.eql({
                    'url': 'localhost:8080/v1/jobs/jobPlatformName/runs/runId/actions/stop',
                    method: 'POST',
                    headers: {}
                });
            });

            it('Failure Stopping a running run of specific job', async () => {
                requestSenderSendStub.rejects(new Error('timeout'));
                try {
                    await jobConnector.stopRun('jobPlatformName', 'runId');
                    throw new Error('Should not get here');
                } catch (error) {
                    error.message.should.eql('timeout');
                }
            });
        });
    });
});