'use strict';
const should = require('should');
const sinon = require('sinon');
const rewire = require('rewire');
const jobConnector = rewire('../../../../../src/jobs/models/docker/jobConnector');
describe('Docker job connector tests', function () {
    let sandbox, createContainerStub, listContainersStub, getContainerStub, containerStopStub,
        containerLogsStub, startContainerStub, pullStub, modemStub, followProgressStub;

    const dockerJobConfig = {
        environmentVariables: {
            var_a: 'a',
            var_b: 'b'
        },
        dockerImage: 'image',
        jobName: 'jobName',
        reportId: 'reportId'
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

        containerLogsStub = sandbox.stub();
        containerLogsStub.resolves('this is the log');

        getContainerStub.resolves({ stop: containerStopStub, logs: containerLogsStub, remove: () => {} });

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
            await jobConnector.runJob(dockerJobConfig);

            should(pullStub.callCount).eql(1);
            should(pullStub.args[0][0]).eql('image');

            should(createContainerStub.callCount).eql(3);

            createContainerStub.callCount.should.eql(3);
            startContainerStub.callCount.should.eql(3);

            createContainerStub.args[0][0].should.eql({
                Env: [
                    'var_a=a',
                    'var_b=b'
                ],
                Image: 'image',
                name: 'jobName-reportId-0'
            });
            createContainerStub.args[1][0].should.eql({
                Env: [
                    'var_a=a',
                    'var_b=b'
                ],
                Image: 'image',
                name: 'jobName-reportId-1'
            });
            createContainerStub.args[2][0].should.eql({
                Env: [
                    'var_a=a',
                    'var_b=b'
                ],
                Image: 'image',
                name: 'jobName-reportId-2'
            });
        });

        it('Success to create a job and running it immediately, parallelism not defined', async () => {
            dockerJobConfig.parallelism = 1;
            const jobResponse = await jobConnector.runJob(dockerJobConfig);
            jobResponse.should.eql({
                id: 'reportId',
                jobName: 'jobName'
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

            // containerStopStub.callCount.should.eql(2);
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

    describe('Get docker logs', () => {
        it('Get logs of specific job', async () => {
            listContainersStub.resolves([
                { Names: ['should-get-logs-0'] },
                { Names: ['should-get-logs-1'] },
                { Names: ['not stop this one'] }]);

            await jobConnector.getLogs('should', 'get-logs');

            containerLogsStub.callCount.should.eql(2);
        });

        it('Get logs does not find any relevant docker', async () => {
            listContainersStub.resolves([
                { Names: ['should-not-get-0'] },
                { Names: ['should-not-get-1'] }]);

            await jobConnector.getLogs('hello', 'docker');

            containerStopStub.callCount.should.eql(0);
        });

        it('Failure getting logs because of docker error', async () => {
            listContainersStub.rejects(new Error('Failure getting jobs'));
            try {
                await jobConnector.getLogs('jobPlatformName', 'jobRunId');
                throw new Error('Should not get here');
            } catch (error) {
                error.message.should.eql('Failure getting jobs');
            }
        });
    });

    describe('Delete all containers', () => {
        it('Delete 3 containers', async () => {
            listContainersStub.resolves([
                { Names: ['predator-runner.0'] },
                { Names: ['predator-runner.1'] },
                { Names: ['predator-runner.2'] }]);

            const result = await jobConnector.deleteAllContainers('predator-runner');
            should(result).eql({ deleted: 3 });
        });

        it('Delete containers does not find anything to delete', async () => {
            listContainersStub.resolves([]);

            const result = await jobConnector.deleteAllContainers('predator-runner');

            should(result).eql({ deleted: 0 });
        });

        it('Failure deleting containers', async () => {
            listContainersStub.rejects(new Error('Failure deleting jobs'));
            try {
                await jobConnector.deleteAllContainers('predator-runner');
                throw new Error('Should not get here');
            } catch (error) {
                error.message.should.eql('Failure deleting jobs');
            }
        });
    });
});
