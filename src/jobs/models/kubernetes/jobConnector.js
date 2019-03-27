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

module.exports.getLogs = async (jobPlatformName, platformSpecificInternalRunId) => {
    let jobControllerUid = await getJobControllerUid(jobPlatformName, platformSpecificInternalRunId);

    let podsNames = await getPodsByLabel(jobControllerUid);

    let logs = await getLogsByPodsNames(podsNames);

    return logs;
};

async function getJobControllerUid(jobPlatformName, platformSpecificInternalRunId) {
    let url = util.format('%s/apis/batch/v1/namespaces/%s/jobs/%s', kubernetesUrl, kubernetesNamespace, jobPlatformName + '-' + platformSpecificInternalRunId);
    let options = {
        url,
        method: 'GET',
        headers
    };

    let job = await requestSender.send(options);

    let controllerUid = job.spec.selector.matchLabels['controller-uid'];
    return controllerUid;
}

async function getLogsByPodsNames(podsNames) {
    let logs = [];
    podsNames.forEach((podName) => {
        let url = util.format('%s/api/v1/namespaces/%s/pods/%s/log', kubernetesUrl, kubernetesNamespace, podName);
        let options = {
            url,
            method: 'GET',
            headers
        };
        let getLogsPromise = requestSender.send(options);
        logs.push({ type: 'file', name: podName + '.txt', content: getLogsPromise });
    });

    for (let i = 0; i < logs.length; i++) {
        logs[i].content = await logs[i].content;
    }
    return logs;
}

async function getPodsByLabel(jobControllerUid) {
    let url = util.format('%s/api/v1/namespaces/%s/pods?labelSelector=controller-uid=%s', kubernetesUrl, kubernetesNamespace, jobControllerUid);
    let options = {
        url,
        method: 'GET',
        headers
    };

    let pods = await requestSender.send(options);

    let podsNames = pods.items.map((pod) => {
        return pod.metadata.name;
    });
    return podsNames;
}