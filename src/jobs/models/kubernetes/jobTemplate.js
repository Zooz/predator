module.exports.createJobRequest = (jobName, runId, parallelism, environmentVariables, dockerImage, configData, predatorRunner, customDefinition) => {
    const jobTemplate = {
        'apiVersion': 'batch/v1',
        'kind': 'Job',
        'metadata': {
            'name': jobName + '-' + runId,
            'labels': {
                app: predatorRunner,
                runId: runId.toString()
            }
        },
        'spec': {
            'parallelism': parallelism,
            'template': {
                'metadata': {
                    'labels': {
                        app: predatorRunner
                    }
                },
                'spec': {
                    'containers': [
                        {
                            'name': 'predator-runner',
                            'image': dockerImage,
                            'resources': {
                                'requests': {
                                    'cpu': configData['runner_cpu']
                                }
                            },
                            'env': Object.keys(environmentVariables).map(environmentVariable => ({ name: environmentVariable, value: environmentVariables[environmentVariable] }))
                        }
                    ],
                    'restartPolicy': 'Never'
                }
            },
            'backoffLimit': 0
        }
    };
    const jobTemplateWithCustomDefinition = Object.assign(jobTemplate, customDefinition);
    return jobTemplateWithCustomDefinition;
};
