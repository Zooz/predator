const util = require('util');
const fs = require('fs');
const kubernetesConfig = require('../../../config/kubernetesConfig');
const logger = require('../../../common/logger');
const requestSender = require('../../../common/requestSender');
const kubernetesUrl = kubernetesConfig.kubernetesUrl;
const kubernetesNamespace = kubernetesConfig.kubernetesNamespace;

const TOKEN_PATH = '/var/run/secrets/kubernetes.io/serviceaccount/token';
const headers = {};

if (kubernetesConfig.kubernetesToken) {
    logger.info('Using kubernetes token from env var');
    headers.Authorization = 'bearer ' + kubernetesConfig.kubernetesToken;
} else {
    try {
        logger.info('kubernetes token from env var was not provided. will use: ' + TOKEN_PATH);
        const token = fs.readFileSync(TOKEN_PATH);
        headers.Authorization = 'bearer ' + token.toString();
    } catch (error) {
        logger.warn(error, 'Failed to get kubernetes token from: ' + TOKEN_PATH);
    }
}

module.exports.runChaosExperiment = async (kubernetesExperimentConfig) => {
    const resourceKindName = kubernetesExperimentConfig.kind.toLowerCase();
    const url = util.format('%s/apis/chaos-mesh.org/v1/namespaces/%s/%s', kubernetesUrl, kubernetesNamespace, resourceKindName);
    const options = {
        url,
        method: 'POST',
        body: kubernetesExperimentConfig,
        headers
    };
    const response = await requestSender.send(options);
    const genericJobResponse = {
        jobName: response.metadata.name,
        id: response.metadata.uid,
        namespace: response.namespace
    };
    return genericJobResponse;
};