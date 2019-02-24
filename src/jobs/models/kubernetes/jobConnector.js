'use strict';

let util = require('util');
let fs = require('fs');
let requestSender = require('../../../common/requestSender');
let logger = require('../../../common/logger');
let kubernetesConfig = require('../../../config/kubernetesConfig');
let kubernetesUrl = kubernetesConfig.kubernetesUrl;
let kubernetesNamespace = kubernetesConfig.kubernetesNamespace;
let headers = {};

const TOKEN_PATH = '/var/run/secrets/kubernetes.io/serviceaccount/token';

if (kubernetesConfig.kubernetesToken) {
    logger.info('Using kubernetes token from env var');
    headers.Authorization = 'bearer ' + kubernetesConfig.kubernetesToken;
} else {
    try {
        logger.info('kubernetes token from env var was not provided. will use: ' + TOKEN_PATH);
        let token = fs.readFileSync(TOKEN_PATH);
        headers.Authorization = 'bearer ' + token.toString();
    } catch (error) {
        logger.warn(error, 'Failed to get kubernetes token from: ' + TOKEN_PATH);
    }
}

module.exports.runJob = async (kubernetesJobConfig) => {
    let url = util.format('%s/apis/batch/v1/namespaces/%s/jobs', kubernetesUrl, kubernetesNamespace);
    let options = {
        url,
        method: 'POST',
        body: kubernetesJobConfig,
        headers
    };
    let jobResponse = await requestSender.send(options);
    let genericJobResponse = {
        jobName: jobResponse.metadata.name,
        id: jobResponse.metadata.uid,
        namespace: jobResponse.namespace
    };
    return genericJobResponse;
};
module.exports.stopRun = async (jobPlatformName, platformSpecificInternalRunId) => {
    let url = util.format('%s/apis/batch/v1/namespaces/%s/jobs/%s?propagationPolicy=Foreground', kubernetesUrl, kubernetesNamespace, jobPlatformName + '-' + platformSpecificInternalRunId);

    let options = {
        url,
        method: 'DELETE',
        headers
    };

    await requestSender.send(options);
};
