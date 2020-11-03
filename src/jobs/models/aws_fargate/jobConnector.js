'use strict';

const AWS = require('aws-sdk');

module.exports.runJob = async (jobFargateTemplate, job) => {
    const ecs = new AWS.ECS({ region: job.tag });
    await ecs.runTask(jobFargateTemplate).promise();
};
module.exports.stopRun = async (jobPlatformName, job) => {
    const ecs = new AWS.ECS({ region: job.tag });
    let runningTasks = await ecs.listTasks({ desiredStatus: 'RUNNING' }).promise();
    let describeTaskPromise;
    if (runningTasks.taskArns.length > 0) {
        describeTaskPromise = await ecs.describeTasks({ tasks: runningTasks.taskArns, include: ['TAGS'] }).promise();
        for (let i = 0; i < describeTaskPromise.tasks.length; i++) {
            const task = describeTaskPromise.tasks[i];
            if (task.tags.find(o => o.key === 'job_identifier' && o.value === jobPlatformName)) {
                ecs.stopTask({ task: task.taskArn }).promise();
            }
        }
    }
};

module.exports.getLogs = async () => {
    throw new Error('Not implemented');
};

module.exports.deleteAllContainers = async () => {
    throw new Error('Not implemented');
};
