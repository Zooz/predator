module.exports.createJobRequest = (jobName, runId, parallelism, environmentVariables, dockerImage, configData, customDefinition) => {
    const jobTemplate = {
        id: jobName,
        description: 'Runs a performance test',
        run: {
            cpus: configData['runner_cpu'],
            mem: configData['runner_memory'],
            disk: 0,
            maxLaunchDelay: 30,
            docker: {
                image: dockerImage
            },
            env: environmentVariables
        },
        parallelism: parallelism
    };

    const jobTemplateWithCustomDefinition = Object.assign(jobTemplate, customDefinition);
    return jobTemplateWithCustomDefinition;
};
