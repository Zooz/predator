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

module.exports.getLogs = async (jobPlatformName, platformSpecificInternalRunId, predatorRunnerPrefix) => {
    let jobControllerUid = await getJobControllerUid(jobPlatformName, platformSpecificInternalRunId);

    let podsNames = await getPodsByLabel(jobControllerUid);

    let logs = await getLogsByPodsNames(podsNames, predatorRunnerPrefix);

    return logs;
};

module.exports.deleteAllContainers = async (jobPlatformName) => {
    let jobs = await getAllPredatorRunnerJobs(jobPlatformName);
    let allPredatorRunnersPods = [];
    for (let i = 0; i < jobs.length; i++) {
        const pods = await getPodsByLabel(jobs[i].metadata.uid);
        allPredatorRunnersPods = allPredatorRunnersPods.concat(pods);
    }

    let deleted = 0;
    for (let i = 0; i < allPredatorRunnersPods.length; i++) {
        let pod = await getPodByName(allPredatorRunnersPods[i]);

        let containers = pod.status.containerStatuses;
        containers = containers.find(o => o.name === jobPlatformName);
        if (containers && containers.state.terminated && containers.state.terminated.finishedAt) {
            await deleteContainer(pod);
            deleted++;
        }
    }
    return { deleted };
};

async function getAllPredatorRunnerJobs(jobPlatformName) {
    let url = util.format('%s/apis/batch/v1/namespaces/%s/jobs?labelSelector=app=%s', kubernetesUrl, kubernetesNamespace, jobPlatformName);

    let options = {
        url,
        method: 'GET',
        headers
    };

    let jobs = await requestSender.send(options);
    jobs = jobs.items;
    return jobs;
}

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

async function getLogsByPodsNames(podsNames, predatorRunnerPrefix) {
    let logs = [];
    podsNames.forEach((podName) => {
        let url = util.format('%s/api/v1/namespaces/%s/pods/%s/log?container=%s', kubernetesUrl, kubernetesNamespace, podName, 'predator-runner');
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

async function getPodByName(podName) {
    let url = util.format('%s/api/v1/namespaces/%s/pods/%s', kubernetesUrl, kubernetesNamespace, podName);
    let options = {
        url,
        method: 'GET',
        headers
    };
    let pod = await requestSender.send(options);
    return pod;
}

async function deleteContainer(pod) {
    let url = util.format('%s/apis/batch/v1/namespaces/%s/jobs/%s?propagationPolicy=Foreground', kubernetesUrl, kubernetesNamespace, pod.metadata.labels['job-name']);

    let options = {
        url,
        method: 'DELETE',
        headers
    };

    await requestSender.send(options);
}
