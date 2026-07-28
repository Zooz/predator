'use strict';

const { ECSClient, RunTaskCommand, ListTasksCommand, DescribeTasksCommand, StopTaskCommand } = require('@aws-sdk/client-ecs');

module.exports.runJob = async (jobFargateTemplate, job) => {
    const ecs = new ECSClient({ region: job.tag });
    await ecs.send(new RunTaskCommand(jobFargateTemplate));
};
module.exports.stopRun = async (jobPlatformName, job) => {
    const ecs = new ECSClient({ region: job.tag });
    const runningTasks = await ecs.send(new ListTasksCommand({ desiredStatus: 'RUNNING' }));
    if (runningTasks.taskArns.length > 0) {
        const describedTasks = await ecs.send(new DescribeTasksCommand({ tasks: runningTasks.taskArns, include: ['TAGS'] }));
        const stopPromises = [];
        for (const task of describedTasks.tasks) {
            if (task.tags.find(o => o.key === 'job_identifier' && o.value === jobPlatformName)) {
                stopPromises.push(ecs.send(new StopTaskCommand({ task: task.taskArn })));
            }
        }
        await Promise.all(stopPromises);
    }
};

module.exports.getLogs = async () => {
    throw new Error('Not implemented');
};

module.exports.deleteAllContainers = async () => {
    throw new Error('Not implemented');
};
