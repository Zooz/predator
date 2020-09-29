'use strict';

const util = require('util');
const metronomeConfig = require('../../../config/metronomeConfig');
const requestSender = require('../../../common/requestSender');

const metronomeUrl = metronomeConfig.metronomeUrl;

const headers = {};
if (metronomeConfig.metronomeToken) {
    headers.Authorization = 'token=' + metronomeConfig.metronomeToken;
}

module.exports.runJob = async (metronomeJobConfig) => {
    const parallelism = metronomeJobConfig.parallelism || 1;
    delete metronomeJobConfig.parallelism;
    const deployJobMethod = await chooseDeployJobMethod(metronomeJobConfig);
    const deployJobResponse = await deployJob(deployJobMethod, metronomeJobConfig);

    const runJobPromises = [];
    for (let i = 0; i < parallelism; i++) {
        runJobPromises.push(runJob(metronomeJobConfig.id));
    }
    await Promise.all(runJobPromises);

    const genericJobResponse = {
        jobName: deployJobResponse.id
    };
    return genericJobResponse;
};

module.exports.stopRun = async (jobPlatformName) => {
    const url = util.format('%s/v1/jobs/%s/runs', metronomeUrl, jobPlatformName);
    const options = {
        method: 'GET',
        url: url,
        headers
    };

    const currentJobRuns = await requestSender.send(options);

    const stopJobPromises = [];
    currentJobRuns.forEach((jobRun) => {
        stopJobPromises.push(async () => {
            const url = util.format('%s/v1/jobs/%s/runs/%s/actions/stop', metronomeUrl, jobPlatformName, jobRun.id);
            const options = {
                method: 'POST',
                url: url,
                headers
            };
            await requestSender.send(options);
        });
    });

    stopJobPromises.forEach(stopJob => stopJob());
    await Promise.all(stopJobPromises);
};

async function deployJob(method, metronomeJobConfig) {
    const url = method === 'POST' ? util.format('%s/v1/jobs', metronomeUrl) : util.format('%s/v1/jobs/%s', metronomeUrl, metronomeJobConfig.id);
    const options = {
        url,
        body: metronomeJobConfig,
        method,
        headers
    };

    const deployJobResponse = await requestSender.send(options);
    return deployJobResponse;
}

async function chooseDeployJobMethod(metronomeJobConfig) {
    const url = util.format('%s/v1/jobs/%s', metronomeUrl, metronomeJobConfig.id);
    const options = {
        url,
        headers,
        method: 'GET'
    };

    let deployJobMethod = 'PUT';
    try {
        await requestSender.send(options);
    } catch (error) {
        if (error.statusCode === 404) {
            deployJobMethod = 'POST';
        }
    }
    return deployJobMethod;
}

async function runJob(jobId) {
    const url = util.format('%s/v1/jobs/%s/runs', metronomeUrl, jobId);

    const options = {
        url: url,
        headers,
        method: 'POST'
    };

    const response = await requestSender.send(options);
    return response;
}

module.exports.getLogs = () => {
    const error = new Error('Getting logs not supported in metronome');
    error.statusCode = 501;
    throw error;
};

module.exports.deleteAllContainers = async function () {
    const error = new Error('Deleting containers not supported in metronome');
    error.statusCode = 501;
    throw error;
};
