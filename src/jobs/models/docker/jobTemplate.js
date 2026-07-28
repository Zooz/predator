module.exports.createJobRequest = (jobName, reportId, parallelism, environmentVariables, dockerImage) => {
    return {
        environmentVariables,
        dockerImage,
        parallelism,
        reportId,
        jobName
    };
};
