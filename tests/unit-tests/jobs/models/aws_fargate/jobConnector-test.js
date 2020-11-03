'use strict';
const should = require('should');
const sinon = require('sinon');
const rewire = require('rewire');
const jobConnector = rewire('../../../../../src/jobs/models/aws_fargate/jobConnector');
const AWS = require('aws-sdk');
describe('aws fargate job connector tests', function () {
    let sandbox, ecsStub, runTaskStub,
        listTasksStub, describeTasksStub, stopTaskStub;

    const farGateJobConfig = {
        hello: 'fargate'
    };

    before(() => {
        sandbox = sinon.sandbox.create();
        runTaskStub = sandbox.stub();
        listTasksStub = sandbox.stub();
        describeTasksStub = sandbox.stub();
        stopTaskStub = sandbox.stub();

        listTasksStub.returns({
            promise: () => {
            }
        });
        describeTasksStub.returns({
            promise: () => {
            }
        });
        stopTaskStub.returns({
            promise: () => {
            }
        });

        runTaskStub.returns({
            promise: () => {
            }
        });

        ecsStub = sandbox.stub(AWS, 'ECS')
            .returns({
                runTask: runTaskStub,
                listTasks: listTasksStub,
                describeTasks: describeTasksStub,
                stopTask: stopTaskStub
            }
            );
    });

    after(() => {
        sandbox.restore();
    });

    afterEach(() => {
        sandbox.resetHistory();
    });

    describe('Run new job', () => {
        it('Success to create a job and running it immediately', async () => {
            await jobConnector.runJob(farGateJobConfig, { tag: 'eu-west-1' });

            should(ecsStub.callCount).eql(1);
            should(ecsStub.args[0][0]).eql({ region: 'eu-west-1' });

            should(runTaskStub.callCount).eql(1);
            should(runTaskStub.args[0][0]).eql(farGateJobConfig);
        });

        it('Fail to run job', async () => {
            runTaskStub.returns({
                promise: () => {
                    throw new Error('failure');
                }
            });
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
            listTasksStub.returns({
                promise: () => {
                    return { taskArns: ['1', '2', '3'] };
                }
            });

            describeTasksStub.returns({
                promise: () => {
                    return {
                        tasks: [{ taskArn: 1, tags: [{ key: 'job_identifier', value: 'jobPlatformName' }] },
                            { taskArn: 2, tags: [{ key: 'job_identifier', value: 'jobPlatformName' }] }]
                    };
                }
            });
            await jobConnector.stopRun('jobPlatformName', { tag: 'eu-west-1' });

            should(stopTaskStub.args[0][0]).eql({ task: 1 });
            should(stopTaskStub.args[1][0]).eql({ task: 2 });
        });

        it('No running jobs found', async () => {
            listTasksStub.returns({
                promise: () => {
                    return { taskArns: [] };
                }
            });

            await jobConnector.stopRun('jobPlatformName', { tag: 'eu-west-1' });

            should(stopTaskStub.called).eql(false);
        });

        it('No running jobs found with matched jobPlatform identifier', async () => {
            listTasksStub.returns({
                promise: () => {
                    return { taskArns: ['1', '2', '3'] };
                }
            });

            describeTasksStub.returns({
                promise: () => {
                    return {
                        tasks: [{ taskArn: 1, tags: [{ key: 'job_identifier', value: 'notMatched' }] },
                            { taskArn: 2, tags: [{ key: 'job_identifier', value: 'notMatched' }] }]
                    };
                }
            });
            await jobConnector.stopRun('jobPlatformName', { tag: 'eu-west-1' });
            should(stopTaskStub.called).eql(false);
        });

        it('Failure Stopping a running run of specific job', async () => {
            listTasksStub.returns({
                promise: () => {
                    throw new Error('failure');
                }
            });

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
