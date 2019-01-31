let config = require('../../../config/serviceConfig');

module.exports.createJobRequest = (jobName, runId, environmentVariables, dockerImage) => {
    return {
        id: jobName,
        description: 'Runs a performance test',
        run: {
            cpus: config.runnerCpu || 1,
            mem: config.runnerMemory || 2048,
            disk: 0,
            maxLaunchDelay: 30,
            docker: {
                image: dockerImage
            },
            env: environmentVariables
        }
    };
};
