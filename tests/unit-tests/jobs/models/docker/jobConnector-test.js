'use strict';
let should = require('should');
let sinon = require('sinon');
let rewire = require('rewire');
let jobConnector = rewire('../../../../../src/jobs/models/docker/jobConnector');
describe('Docker job connector tests', function () {
    let sandbox, createContainerStub, listContainersStub, getContainerStub, containerStopStub,
        startContainerStub, pullStub, modemStub, followProgressStub;

    let dockerJobConfig = {
        environmentVariables: {
            var_a: 'a',
            var_b: 'b'
        },
        dockerImage: 'image',
        jobName: 'jobName',
        runId: 'runId'
    };

    before(() => {
        sandbox = sinon.sandbox.create();
    });

    beforeEach(() => {
        startContainerStub = sandbox.stub();

        createContainerStub = sandbox.stub();
        createContainerStub.resolves({
            start: startContainerStub
        });

        listContainersStub = sandbox.stub();
        getContainerStub = sandbox.stub();

        containerStopStub = sandbox.stub();
        containerStopStub.resolves();

        getContainerStub.resolves({ stop: containerStopStub });

        pullStub = sandbox.stub();

        followProgressStub = sandbox.stub();
        followProgressStub.yields();
        modemStub = {
            followProgress: followProgressStub
        };

        jobConnector.__set__('docker', {
            createContainer: createContainerStub,
            listContainers: listContainersStub,
            getContainer: getContainerStub,
            pull: pullStub,
            modem: modemStub
        });
    });

    after(() => {
        sandbox.restore();
    });

    describe('Run new job', () => {
        it('Success to create a job and running it immediately, parallelism is 3', async () => {
            dockerJobConfig.parallelism = 3;
            let jobResponse = await jobConnector.runJob(dockerJobConfig);

            should(pullStub.callCount).eql(1);
            should(pullStub.args[0][0]).eql('image');

            should(createContainerStub.callCount).eql(3);

            createContainerStub.callCount.should.eql(3);
            startContainerStub.callCount.should.eql(3);

            createContainerStub.args[0][0].should.eql({
                'Env': [
                    'var_a=a',
                    'var_b=b'
                ],
                'Image': 'image',
                'name': 'jobName-runId-0'
            });
            createContainerStub.args[1][0].should.eql({
                'Env': [
                    'var_a=a',
                    'var_b=b'
                ],
                'Image': 'image',
                'name': 'jobName-runId-1'
            });
            createContainerStub.args[2][0].should.eql({
                'Env': [
                    'var_a=a',
                    'var_b=b'
                ],
                'Image': 'image',
                'name': 'jobName-runId-2'
            });
        });

        it('Success to create a job and running it immediately, parallelism not defined', async () => {
            dockerJobConfig.parallelism = 1;
            let jobResponse = await jobConnector.runJob(dockerJobConfig);
            jobResponse.should.eql({
                'id': 'runId',
                'jobName': 'jobName'
            });

            createContainerStub.callCount.should.eql(1);
            startContainerStub.callCount.should.eql(1);
        });

        it('Fail to create a job - error on pulling image', async () => {
            followProgressStub.yields(new Error('Failure pulling image'));

            try {
                await jobConnector.runJob(dockerJobConfig);
                throw new Error('Should not get here');
            } catch (error) {
                error.should.eql(new Error('Failure pulling image'));
            }
        });

        it('Fail to create a job - error on create containers', async () => {
            createContainerStub.rejects(new Error('Failure to create docker'));

            try {
                await jobConnector.runJob(dockerJobConfig);
                throw new Error('Should not get here');
            } catch (error) {
                error.should.eql(new Error('Failure to create docker'));
            }
        });

        it('Fail to create a job - error on start containers', async () => {
            startContainerStub.rejects(new Error('Failure to start docker'));

            try {
                await jobConnector.runJob(dockerJobConfig);
                throw new Error('Should not get here');
            } catch (error) {
                error.should.eql(new Error('Failure to start docker'));
            }
        });
    });

    describe('Stop running job which is found', () => {
        it('Stop a running run of specific job', async () => {
            listContainersStub.resolves([
                { Names: ['should-stop-0'] },
                { Names: ['should-stop-1'] },
                { Names: ['not stop this one'] }]);

            await jobConnector.stopRun('should', 'stop');

            containerStopStub.callCount.should.eql(2);
        });

        it('Stop a running run of specific job which is not found', async () => {
            listContainersStub.resolves([
                { Names: ['should-stop-0'] },
                { Names: ['should-stop-1'] },
                { Names: ['not stop this one'] }]);

            await jobConnector.stopRun('hello', 'docker');

            containerStopStub.callCount.should.eql(0);
        });

        it('Failure Stopping a running run of specific job', async () => {
            listContainersStub.rejects(new Error('Failure getting jobs'));
            try {
                await jobConnector.stopRun('jobPlatformName', 'jobRunId');
                throw new Error('Should not get here');
            } catch (error) {
                error.message.should.eql('Failure getting jobs');
            }
        });
    });
});