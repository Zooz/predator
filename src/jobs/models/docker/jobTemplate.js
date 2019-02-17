module.exports.createJobRequest = (jobName, runId, parallelism, environmentVariables, dockerImage) => {
    return {
        'environmentVariables': environmentVariables,
        'dockerImage': dockerImage,
        'parallelism': parallelism,
        'runId': runId,
        'jobName': jobName
    };
};