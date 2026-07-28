'use strict';
const should = require('should');
const sinon = require('sinon');
const { ECSClient, RunTaskCommand, ListTasksCommand, DescribeTasksCommand, StopTaskCommand } = require('@aws-sdk/client-ecs');
const jobConnector = require('../../../../../src/jobs/models/aws_fargate/jobConnector');

describe('aws fargate job connector tests', function () {
    let sandbox, sendStub;

    const farGateJobConfig = {
        hello: 'fargate'
    };

    const sentCommands = (type) => sendStub.args.map(args => args[0]).filter(command => command instanceof type);

    before(() => {
        sandbox = sinon.createSandbox();
        sendStub = sandbox.stub(ECSClient.prototype, 'send');
    });

    after(() => {
        sandbox.restore();
    });

    afterEach(() => {
        sendStub.reset();
    });

    describe('Run new job', () => {
        it('Success to create a job and running it immediately', async () => {
            sendStub.resolves({});

            await jobConnector.runJob(farGateJobConfig, { tag: 'eu-west-1' });

            const runTasks = sentCommands(RunTaskCommand);
            should(runTasks.length).eql(1);
            should(runTasks[0].input).eql(farGateJobConfig);
            // the v3 client resolves its region lazily, so read it back off the instance under test
            should(await sendStub.thisValues[0].config.region()).eql('eu-west-1');
        });

        it('Fail to run job', async () => {
            sendStub.rejects(new Error('failure'));
            try {
                await jobConnector.runJob(farGateJobConfig, { tag: 'eu-west-1' });
                throw new Error('should not get here');
            } catch (error) {
                should(error.message).eql('failure');
            }
        });
    });

    describe('Stop running job which is found', () => {
        it('Stop a running run of specific job', async () => {
            sendStub.withArgs(sinon.match.instanceOf(ListTasksCommand)).resolves({ taskArns: ['1', '2', '3'] });
            sendStub.withArgs(sinon.match.instanceOf(DescribeTasksCommand)).resolves({
                tasks: [{ taskArn: 1, tags: [{ key: 'job_identifier', value: 'jobPlatformName' }] },
                    { taskArn: 2, tags: [{ key: 'job_identifier', value: 'jobPlatformName' }] }]
            });
            sendStub.withArgs(sinon.match.instanceOf(StopTaskCommand)).resolves({});

            await jobConnector.stopRun('jobPlatformName', { tag: 'eu-west-1' });

            const stopTasks = sentCommands(StopTaskCommand);
            should(stopTasks.length).eql(2);
            should(stopTasks[0].input).eql({ task: 1 });
            should(stopTasks[1].input).eql({ task: 2 });
        });

        it('No running jobs found', async () => {
            sendStub.withArgs(sinon.match.instanceOf(ListTasksCommand)).resolves({ taskArns: [] });

            await jobConnector.stopRun('jobPlatformName', { tag: 'eu-west-1' });

            should(sentCommands(StopTaskCommand).length).eql(0);
        });

        it('No running jobs found with matched jobPlatform identifier', async () => {
            sendStub.withArgs(sinon.match.instanceOf(ListTasksCommand)).resolves({ taskArns: ['1', '2', '3'] });
            sendStub.withArgs(sinon.match.instanceOf(DescribeTasksCommand)).resolves({
                tasks: [{ taskArn: 1, tags: [{ key: 'job_identifier', value: 'notMatched' }] },
                    { taskArn: 2, tags: [{ key: 'job_identifier', value: 'notMatched' }] }]
            });

            await jobConnector.stopRun('jobPlatformName', { tag: 'eu-west-1' });

            should(sentCommands(StopTaskCommand).length).eql(0);
        });

        it('Failure Stopping a running run of specific job', async () => {
            sendStub.withArgs(sinon.match.instanceOf(ListTasksCommand)).rejects(new Error('failure'));

            try {
                await jobConnector.stopRun('jobPlatformName', { tag: 'eu-west-1' });
                throw new Error('should not get here');
            } catch (error) {
                should(error.message).eql('failure');
            }
        });

        it('getLogs not implemented', async () => {
            try {
                await jobConnector.getLogs();
                throw new Error('should not get here');
            } catch (error) {
                should(error.message).eql('Not implemented');
            }
        });

        it('deleteAllContainers not implemented', async () => {
            try {
                await jobConnector.deleteAllContainers();
                throw new Error('should not get here');
            } catch (error) {
                should(error.message).eql('Not implemented');
            }
        });
    });
});
