module.exports.createJobRequest = (jobName, runId, parallelism, environmentVariables, dockerImage, configData) => {
    return {
        id: jobName,
        description: 'Runs a performance test',
        run: {
            cpus: configData['runner_cpu'] || 1,
            mem: configData['runner_memory'] || 2048,
            disk: 0,
            maxLaunchDelay: 30,
            docker: {
                image: dockerImage
            },
            env: environmentVariables
        },
        parallelism: parallelism
    };
};
