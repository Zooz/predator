const generateError = require('../../../common/generateError');
module.exports.createJobRequest = (jobPlatformName, reportId, parallelism, environmentVariables, dockerImage, configData, predatorRunner, customDefinition, jobTag) => {
    const jobTagData = customDefinition[jobTag];
    if (!jobTagData) {
        throw generateError(400, `${jobTag} tag is not exists in customDefinition`);
    }

    const runTaskRequest = {
        capacityProviderStrategy: [{ capacityProvider: jobTagData.capacity_provider }],
        count: parallelism,
        overrides: {
            containerOverrides: [{
                name: 'predator-runner',
                environment: Object.keys(environmentVariables).map(environmentVariable => ({ name: environmentVariable, value: environmentVariables[environmentVariable] }))
            }]
        },
        taskDefinition: jobTagData.task_definition,
        tags: [{ key: 'job_identifier', value: jobPlatformName }],
        networkConfiguration: { awsvpcConfiguration: { subnets: jobTagData.subnets }
        }
    };

    return runTaskRequest;
};
