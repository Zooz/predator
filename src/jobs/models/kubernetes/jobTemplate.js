const _ = require('lodash');

module.exports.createJobRequest = (jobName, reportId, parallelism, environmentVariables, dockerImage, configData, predatorRunner, customDefinition) => {
    const jobTemplate = {
        apiVersion: 'batch/v1',
        kind: 'Job',
        metadata: {
            name: reportId,
            labels: {
                app: predatorRunner,
                reportId: reportId
            }
        },
        spec: {
            parallelism: parallelism,
            template: {
                metadata: {
                    labels: {
                        app: predatorRunner
                    }
                },
                spec: {
                    containers: [
                        {
                            name: 'predator-runner',
                            image: dockerImage,
                            resources: {
                                requests: {
                                    cpu: configData.runner_cpu
                                }
                            },
                            env: Object.keys(environmentVariables).map(environmentVariable => ({ name: environmentVariable, value: environmentVariables[environmentVariable] }))
                        }
                    ],
                    restartPolicy: 'Never'
                }
            },
            backoffLimit: 0
        }
    };

    const jobTemplateWithCustomDefinition = _.merge(jobTemplate, customDefinition);
    return jobTemplateWithCustomDefinition;
};
