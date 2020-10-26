module.exports.createJobRequest = (jobName, reportId, parallelism, environmentVariables, dockerImage) => {
    return {
        environmentVariables: environmentVariables,
        dockerImage: dockerImage,
        parallelism: parallelism,
        reportId: reportId,
        jobName: jobName
    };
};
