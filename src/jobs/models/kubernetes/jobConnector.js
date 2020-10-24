'use strict';

const util = require('util');
const fs = require('fs');
const requestSender = require('../../../common/requestSender');
const logger = require('../../../common/logger');
const kubernetesConfig = require('../../../config/kubernetesConfig');
const kubernetesUrl = kubernetesConfig.kubernetesUrl;
const kubernetesNamespace = kubernetesConfig.kubernetesNamespace;
const headers = {};

const TOKEN_PATH = '/var/run/secrets/kubernetes.io/serviceaccount/token';

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

module.exports.runJob = async (kubernetesJobConfig) => {
    const url = util.format('%s/apis/batch/v1/namespaces/%s/jobs', kubernetesUrl, kubernetesNamespace);
    const options = {
        url,
        method: 'POST',
        body: kubernetesJobConfig,
        headers
    };
    const jobResponse = await requestSender.send(options);
    const genericJobResponse = {
        jobName: jobResponse.metadata.name,
        id: jobResponse.metadata.uid,
        namespace: jobResponse.namespace
    };
    return genericJobResponse;
};
module.exports.stopRun = async (jobPlatformName) => {
    const url = util.format('%s/apis/batch/v1/namespaces/%s/jobs/%s?propagationPolicy=Foreground', kubernetesUrl, kubernetesNamespace, jobPlatformName);

    const options = {
        url,
        method: 'DELETE',
        headers
    };

    await requestSender.send(options);
};

module.exports.getLogs = async (jobPlatformName, predatorRunnerPrefix) => {
    const jobControllerUid = await getJobControllerUid(jobPlatformName);

    const podsNames = await getPodsByLabel(jobControllerUid);

    const logs = await getLogsByPodsNames(podsNames, predatorRunnerPrefix);

    return logs;
};

module.exports.deleteAllContainers = async (jobPlatformName) => {
    const jobs = await getAllPredatorRunnerJobs(jobPlatformName);
    let allPredatorRunnersPods = [];
    for (let i = 0; i < jobs.length; i++) {
        const pods = await getPodsByLabel(jobs[i].metadata.uid);
        allPredatorRunnersPods = allPredatorRunnersPods.concat(pods);
    }

    let deleted = 0;
    for (let i = 0; i < allPredatorRunnersPods.length; i++) {
        const pod = await getPodByName(allPredatorRunnersPods[i]);

        let containers = pod.status.containerStatuses;
        containers = containers.find(o => o.name === 'predator-runner');
        if (containers && containers.state.terminated && containers.state.terminated.finishedAt) {
            await deleteContainer(pod);
            deleted++;
        }
    }
    return { deleted };
};

async function getAllPredatorRunnerJobs(jobPlatformName) {
    const url = util.format('%s/apis/batch/v1/namespaces/%s/jobs?labelSelector=app=%s', kubernetesUrl, kubernetesNamespace, jobPlatformName);

    const options = {
        url,
        method: 'GET',
        headers
    };

    let jobs = await requestSender.send(options);
    jobs = jobs.items;
    return jobs;
}

async function getJobControllerUid(jobPlatformName) {
    const url = util.format('%s/apis/batch/v1/namespaces/%s/jobs/%s', kubernetesUrl, kubernetesNamespace, jobPlatformName);
    const options = {
        url,
        method: 'GET',
        headers
    };

    const job = await requestSender.send(options);

    const controllerUid = job.spec.selector.matchLabels['controller-uid'];
    return controllerUid;
}

async function getLogsByPodsNames(podsNames) {
    const logs = [];
    podsNames.forEach((podName) => {
        const url = util.format('%s/api/v1/namespaces/%s/pods/%s/log?container=%s', kubernetesUrl, kubernetesNamespace, podName, 'predator-runner');
        const options = {
            url,
            method: 'GET',
            headers
        };
        const getLogsPromise = requestSender.send(options);
        logs.push({ type: 'file', name: podName + '.txt', content: getLogsPromise });
    });

    for (let i = 0; i < logs.length; i++) {
        logs[i].content = await logs[i].content;
    }
    return logs;
}

async function getPodsByLabel(jobControllerUid) {
    const url = util.format('%s/api/v1/namespaces/%s/pods?labelSelector=controller-uid=%s', kubernetesUrl, kubernetesNamespace, jobControllerUid);
    const options = {
        url,
        method: 'GET',
        headers
    };

    const pods = await requestSender.send(options);

    const podsNames = pods.items.map((pod) => {
        return pod.metadata.name;
    });
    return podsNames;
}

async function getPodByName(podName) {
    const url = util.format('%s/api/v1/namespaces/%s/pods/%s', kubernetesUrl, kubernetesNamespace, podName);
    const options = {
        url,
        method: 'GET',
        headers
    };
    const pod = await requestSender.send(options);
    return pod;
}

async function deleteContainer(pod) {
    const url = util.format('%s/apis/batch/v1/namespaces/%s/jobs/%s?propagationPolicy=Foreground', kubernetesUrl, kubernetesNamespace, pod.metadata.labels['job-name']);

    const options = {
        url,
        method: 'DELETE',
        headers
    };

    await requestSender.send(options);
}
