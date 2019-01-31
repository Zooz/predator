'use strict';

let util = require('util');
let metronomeConfig = require('../../../config/metronomeConfig');
let requestSender = require('../../../common/requestSender');

let metronomeUrl = metronomeConfig.metronomeUrl;

let headers = {};
if (metronomeConfig.metronomeToken) {
    headers.Authorization = 'token=' + metronomeConfig.metronomeToken;
}

module.exports.runJob = async (metronomeJobConfig) => {
    let deployJobMethod = await chooseDeployJobMethod(metronomeJobConfig);
    let deployJobResponse = await deployJob(deployJobMethod, metronomeJobConfig);
    let runJobResponse = await runJob(metronomeJobConfig.id);

    let genericJobResponse = {
        jobName: deployJobResponse.id,
        id: runJobResponse.id
    };
    return genericJobResponse;
};

module.exports.stopRun = async (jobPlatformName, platformSpecificInternalRunId) => {
    let url = util.format('%s/v1/jobs/%s/runs/%s/actions/stop', metronomeUrl, jobPlatformName, platformSpecificInternalRunId);
    let options = {
        method: 'POST',
        url: url,
        headers
    };
    await requestSender.send(options);
};

async function deployJob(method, metronomeJobConfig) {
    let url = method === 'POST' ? util.format('%s/v1/jobs', metronomeUrl) : util.format('%s/v1/jobs/%s', metronomeUrl, metronomeJobConfig.id);
    let options = {
        url,
        body: metronomeJobConfig,
        method,
        headers
    };

    let deployJobResponse = await requestSender.send(options);
    return deployJobResponse;
}

async function chooseDeployJobMethod(metronomeJobConfig) {
    let url = util.format('%s/v1/jobs/%s', metronomeUrl, metronomeJobConfig.id);
    let options = {
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
    let url = util.format('%s/v1/jobs/%s/runs', metronomeUrl, jobId);

    let options = {
        url: url,
        headers,
        method: 'POST'
    };

    let response = await requestSender.send(options);
    return response;
}
