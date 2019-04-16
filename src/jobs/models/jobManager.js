'use strict';
const logger = require('../../common/logger'),
    uuid = require('uuid'),
    CronJob = require('cron').CronJob,
    configHandler = require('../../configManager/models/configHandler'),
    util = require('util'),
    dockerHubConnector = require('./dockerHubConnector'),
    databaseConnector = require('./database/databaseConnector');

let cronJobs = {};
const JOB_PLATFORM_NAME = 'predator.%s';

module.exports.reloadCronJobs = async function () {
    const configData = await configHandler.getConfig();
    try {
        let jobs = await databaseConnector.getJobs();
        jobs.forEach(async function (job) {
            if (job.cron_expression !== null) {
                addCron(job.id.toString(), job, job.cron_expression, configData);
            }
        });
    } catch (error) {
        Promise.reject(new Error('Unable to reload scheduled jobs, error: ' + error));
    }
};

module.exports.createJob = async function (job) {
    const configData = await configHandler.getConfig();
    const jobConnector = require(`./${configData.job_platform.toLowerCase()}/jobConnector`);
    let jobId = uuid.v4();

    try {
        await databaseConnector.insertJob(jobId, job);
        logger.info('Job saved successfully to database');
        let latestDockerImage = await dockerHubConnector.getMostRecentRunnerTag();
        let runId = Date.now();
        let jobSpecificPlatformRequest = createJobRequest(jobId, runId, job, latestDockerImage, configData);
        if (job.run_immediately) {
            await jobConnector.runJob(jobSpecificPlatformRequest);
        }
        if (job.cron_expression) {
            await addCron(jobId, job, job.cron_expression, configData);
        }
        logger.info('Job deployed successfully');
        return createResponse(jobId, job, runId);
    } catch (error) {
        logger.error(error, 'Error occurred trying to create new job');
        return Promise.reject(error);
    }
};

module.exports.deleteJob = function (jobId) {
    if (cronJobs[jobId]) {
        cronJobs[jobId].stop();
        delete cronJobs[jobId];
    }
    return databaseConnector.deleteJob(jobId);
};

module.exports.stopRun = async function (jobId, runId) {
    const configData = await configHandler.getConfig();
    const jobConnector = require(`./${configData.job_platform.toLowerCase()}/jobConnector`);
    await jobConnector.stopRun(util.format(JOB_PLATFORM_NAME, jobId), runId);
};

module.exports.getLogs = async function (jobId, runId) {
    const configData = await configHandler.getConfig();
    const jobConnector = require(`./${configData.job_platform.toLowerCase()}/jobConnector`);
    let logs = await jobConnector.getLogs(util.format(JOB_PLATFORM_NAME, jobId), runId);
    let response = {
        files: logs,
        filename: `${jobId}-${runId}.zip`
    };

    return response;
};

module.exports.getJobs = async function (getOneTimeJobs) {
    try {
        let jobs = await databaseConnector.getJobs();
        logger.info('Got jobs list from database successfully');
        if (!getOneTimeJobs) {
            jobs = jobs.filter((job) => job.cron_expression);
        }
        let jobsResponse = jobs.map((job) => {
            return createResponse(job.id, job);
        });

        return jobsResponse;
    } catch (error) {
        logger.error(error, 'Error occurred trying to get jobs');
        return Promise.reject(error);
    }
};

module.exports.getJob = async function (jobId) {
    try {
        let error;
        let job = await databaseConnector.getJob(jobId);
        logger.info('Got job from database successfully');
        if (job.length > 1) {
            logger.error('database returned ' + job.length + ' rows, expected only one.');
            error = new Error('Error occurred in database response');
            error.statusCode = 500;
            return Promise.reject(error);
        } else if (job.length === 1) {
            return createResponse(job[0].id, job[0]);
        } else {
            error = new Error('Not found');
            error.statusCode = 404;
            return Promise.reject(error);
        }
    } catch (error) {
        logger.error(error, 'Error occurred trying to get job');
        return Promise.reject(error);
    }
};

module.exports.updateJob = async function (jobId, jobConfig) {
    const configData = await configHandler.getConfig();
    return databaseConnector.updateJob(jobId, jobConfig)
        .then(function () {
            return databaseConnector.getJob(jobId)
                .then(function (updatedJob) {
                    if (updatedJob.length === 0) {
                        let error = new Error('Not found');
                        error.statusCode = 404;
                        throw error;
                    }
                    if (cronJobs[jobId]) {
                        cronJobs[jobId].stop();
                        delete cronJobs[jobId];
                    }
                    addCron(jobId, updatedJob[0], updatedJob[0].cron_expression, configData);
                    logger.info('Job updated successfully to database');
                });
        }).catch(function (err) {
            logger.error(err, 'Error occurred trying to update job');
            return Promise.reject(err);
        });
};

function createResponse(jobId, jobBody, runId) {
    let response = {
        id: jobId,
        test_id: jobBody.test_id,
        cron_expression: jobBody.cron_expression,
        webhooks: jobBody.webhooks,
        emails: jobBody.emails,
        ramp_to: jobBody.ramp_to,
        parallelism: jobBody.parallelism,
        max_virtual_users: jobBody.max_virtual_users,
        custom_env_vars: jobBody.custom_env_vars,
        run_id: runId,
        arrival_rate: jobBody.arrival_rate,
        duration: jobBody.duration,
        environment: jobBody.environment,
        notes: jobBody.notes,
        proxy_url: jobBody.proxy_url,
        debug: jobBody.debug
    };

    Object.keys(response).forEach(key => {
        if (response[key] === null) {
            delete response[key];
        }
    });

    return response;
}

function createJobRequest(jobId, runId, jobBody, dockerImage, configData) {
    const jobTemplate = require(`./${configData.job_platform.toLowerCase()}/jobTemplate`);
    let jobName = util.format(JOB_PLATFORM_NAME, jobId);
    let rampToPerRunner = jobBody.ramp_to;
    let maxVirtualUsersPerRunner = jobBody.max_virtual_users;

    let parallelism = jobBody.parallelism || 1;
    let arrivalRatePerRunner = Math.ceil(jobBody.arrival_rate / parallelism);
    if (jobBody.ramp_to) {
        rampToPerRunner = Math.ceil(jobBody.ramp_to / parallelism);
    }
    if (jobBody.max_virtual_users) {
        maxVirtualUsersPerRunner = Math.ceil(jobBody.max_virtual_users / parallelism);
    }

    let environmentVariables = {
        JOB_ID: jobId,
        RUN_ID: runId.toString(),
        ENVIRONMENT: jobBody.environment,
        TEST_ID: jobBody.test_id,
        PREDATOR_URL: configData.internal_address,
        DELAY_RUNNER_MS: configData.delay_runner_ms,
        ARRIVAL_RATE: arrivalRatePerRunner.toString(),
        DURATION: jobBody.duration.toString()
    };
    let metricsExport = configData.metrics_plugin_name === 'influx' ? configData.influx_metrics : configData.prometheus_metrics;

    if (configData.metrics_plugin_name && metricsExport) {
        environmentVariables.METRICS_PLUGIN_NAME = configData.metrics_plugin_name;
        if (typeof metricsExport === 'object') {
            metricsExport = JSON.stringify(metricsExport);
        }
        environmentVariables.METRICS_EXPORT_CONFIG = Buffer.from(metricsExport).toString('base64');
    }

    if (jobBody.proxy_url) {
        environmentVariables.PROXY_URL = jobBody.proxy_url;
    }
    if (jobBody.debug) {
        environmentVariables.DEBUG = jobBody.debug;
    }
    if (jobBody.emails) {
        environmentVariables.EMAILS = jobBody.emails.join(';');
    }
    if (jobBody.webhooks) {
        environmentVariables.WEBHOOKS = jobBody.webhooks.join(';');
    }
    if (rampToPerRunner) {
        environmentVariables.RAMP_TO = rampToPerRunner.toString();
    } else {
        delete environmentVariables.RAMP_TO;
    }

    if (maxVirtualUsersPerRunner) {
        environmentVariables.MAX_VIRTUAL_USERS = maxVirtualUsersPerRunner.toString();
    } else {
        delete environmentVariables.MAX_VIRTUAL_USERS;
    }

    if (jobBody.custom_env_vars) {
        Object.keys(jobBody.custom_env_vars).forEach(customEnvVar => {
            environmentVariables['CUSTOM_' + customEnvVar] = jobBody.custom_env_vars[customEnvVar];
        });
    }

    let jobRequest = jobTemplate.createJobRequest(jobName, runId, parallelism, environmentVariables, dockerImage, configData);

    return jobRequest;
}

function addCron(jobId, job, cronExpression, configData) {
    const jobConnector = require(`./${configData.job_platform.toLowerCase()}/jobConnector`);
    let scheduledJob = new CronJob(cronExpression, async function () {
        try {
            let latestDockerImage = await dockerHubConnector.getMostRecentRunnerTag();
            let runId = Date.now();
            let jobSpecificPlatformConfig = createJobRequest(jobId, runId, job, latestDockerImage, configData);
            await jobConnector.runJob(jobSpecificPlatformConfig);
        } catch (error) {
            logger.error({ id: jobId, error: error }, 'Unable to run scheduled job.');
        }
    }, function () {
        logger.info('Job: ' + jobId + ' completed.');
    }, true);
    cronJobs[jobId] = scheduledJob;
}