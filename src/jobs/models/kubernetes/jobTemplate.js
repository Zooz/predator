module.exports.createJobRequest = (jobName, runId, parallelism, environmentVariables, dockerImage, configData) => {
    return {
        'apiVersion': 'batch/v1',
        'kind': 'Job',
        'metadata': {
            'name': jobName + '-' + runId
        },
        'spec': {
            'parallelism': parallelism,
            'template': {
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
};