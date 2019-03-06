const configHandler = require('../../../configManager/models/configHandler');

module.exports.createJobRequest = async (jobName, runId, parallelism, environmentVariables, dockerImage) => {
    return {
        id: jobName,
        description: 'Runs a performance test',
        run: {
            cpus: await configHandler.getConfigValue('runner_cpu') || 1,
            mem: await configHandler.getConfigValue('runner_memory') || 2048,
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
