const configHandler = require('../../../configManager/models/configHandler'),
    configData = configHandler.getConfig();

module.exports.createJobRequest = (jobName, runId, parallelism, environmentVariables, dockerImage) => {
    return {
        id: jobName,
        description: 'Runs a performance test',
        run: {
            cpus: configData.runnerCpu || 1,
            mem: configData.runnerMemory || 2048,
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
