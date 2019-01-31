'use strict';
let logger = require('../../common/logger');

let uuid = require('uuid');
let CronJob = require('cron').CronJob;
let config = require('../../config/serviceConfig');
let util = require('util');
let dockerHubConnector = require('./dockerHubConnector');
let databaseConnector = require('./database/databaseConnector');

let jobTemplate = require(`./${config.jobPlatform.toLowerCase()}/jobTemplate`);
let jobConnector = require(`./${config.jobPlatform.toLowerCase()}/jobConnector`);

let cronJobs = {};
const JOB_PLATFORM_NAME = 'predator.%s';

module.exports.reloadCronJobs = async function () {
    try {
        let jobs = await databaseConnector.getJobs();
        jobs.forEach(async function (job) {
            if (job.cron_expression !== null) {
                addCron(job.id.toString(), job, job.cron_expression);
            }
        });
    } catch (error) {
        Promise.reject(new Error('Unable to reload scheduled jobs, error: ' + error));
    }
};

module.exports.createJob = async function (job) {
    let jobId = uuid.v4();

    try {
        await databaseConnector.insertJob(jobId, job);
        logger.info('Job saved successfully to database');
        let latestDockerImage = await dockerHubConnector.getMostRecentRunnerTag();
        let runId = Date.now();
        let jobSpecificPlatformRequest = createJobRequest(jobId, runId, job, latestDockerImage);
        if (job.run_immediately) {
            await jobConnector.runJob(jobSpecificPlatformRequest);
        }
        if (job.cron_expression) {
            addCron(jobId, job, job.cron_expression);
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
    await jobConnector.stopRun(util.format(JOB_PLATFORM_NAME, jobId), runId);
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

module.exports.updateJob = function (jobId, jobConfig) {
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
                    addCron(jobId, updatedJob[0], updatedJob[0].cron_expression);
                    logger.info('Job updated successfully to database');
                });
        }).catch(function (err) {
            logger.error(err, 'Error occurred trying to update job');
            return Promise.reject(err);
        });
};

function createResponse(jobId, jobBody, runId) {
    let response = {};
    response.id = jobId;
    response.test_id = jobBody.test_id;

    if (jobBody.cron_expression) {
        response.cron_expression = jobBody.cron_expression;
    }
    if (jobBody.webhooks) {
        response.webhooks = jobBody.webhooks;
    }
    if (jobBody.emails) {
        response.emails = jobBody.emails;
    }
    if (jobBody.ramp_to) {
        response.ramp_to = jobBody.ramp_to;
    }
    if (jobBody.custom_env_vars) {
        response.custom_env_vars = jobBody.custom_env_vars;
    }
    if (runId) {
        response.run_id = runId;
    }
    response.arrival_rate = jobBody.arrival_rate;
    response.duration = jobBody.duration;
    response.environment = jobBody.environment;
    return response;
}

function createJobRequest(jobId, runId, jobBody, dockerImage) {
    let jobName = util.format(JOB_PLATFORM_NAME, jobId);

    let environmentVariables = {
        JOB_ID: jobId,
        RUN_ID: runId.toString(),
        ENVIRONMENT: jobBody.environment,
        TEST_ID: jobBody.test_id,
        TESTS_API_URL: config.testsApiUrl,
        ARRIVAL_RATE: jobBody.arrival_rate.toString(),
        DURATION: jobBody.duration.toString(),
        CLUSTER: config.cluster,
        PUSH_GATEWAY_URL: config.pushGatewayUrl,
        CONCURRENCY_LIMIT: config.concurrencyLimit.toString(),
        METRICS_PLUGIN_NAME: config.metricsPluginName,
        METRICS_EXPORT_CONFIG: config.metricsExportConfig
    };

    if (jobBody.emails) {
        environmentVariables.EMAILS = jobBody.emails.join(';');
    }
    if (jobBody.webhooks) {
        environmentVariables.WEBHOOKS = jobBody.webhooks.join(';');
    }
    if (jobBody.ramp_to) {
        environmentVariables.RAMP_TO = jobBody.ramp_to.toString();
    } else {
        delete environmentVariables.RAMP_TO;
    }

    if (jobBody.custom_env_vars) {
        Object.keys(jobBody.custom_env_vars).forEach(customEnvVar => {
            environmentVariables['CUSTOM_' + customEnvVar] = jobBody.custom_env_vars[customEnvVar];
        });
    }

    let jobRequest = jobTemplate.createJobRequest(jobName, runId, environmentVariables, dockerImage);

    return jobRequest;
}

function addCron(jobId, job, cronExpression) {
    let scheduledJob = new CronJob(cronExpression, async function () {
        try {
            let latestDockerImage = await dockerHubConnector.getMostRecentRunnerTag();
            let runId = Date.now();
            let jobSpecificPlatformConfig = createJobRequest(jobId, runId, job, latestDockerImage);
            await jobConnector.runJob(jobSpecificPlatformConfig);
        } catch (error) {
            logger.error({ id: jobId, error: error }, 'Unable to run scheduled job.');
        }
    }, function () {
        logger.info('Job: ' + job.id + ' completed.');
    }, true);
    cronJobs[jobId] = scheduledJob;
}