module.exports.createJobRequest = async (jobName, runId, parallelism, environmentVariables, dockerImage, configData) => {
    return {
        id: jobName,
        description: 'Runs a performance test',
        run: {
            cpus: await configData['runner_cpu'] || 1,
            mem: await configData['runner_memory'] || 2048,
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
