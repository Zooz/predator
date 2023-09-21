'use strict';

const uuid = require('uuid');
const util = require('util');
const { CronJob } = require('cron');
const httpContext = require('express-http-context');

const logger = require('../../common/logger'),
    configHandler = require('../../configManager/models/configHandler'),
    testsManager = require('../../tests/models/manager'),
    reportsManager = require('../../reports/models/reportsManager'),
    dockerHubConnector = require('./dockerHubConnector'),
    databaseConnector = require('./database/databaseConnector'),
    webhooksManager = require('../../webhooks/models/webhookManager'),
    streamingManager = require('../../streaming/manager'),
    { STREAMING_EVENT_TYPES } = require('../../streaming/entities/common'),
    { CONFIG, CONTEXT_ID, JOB_TYPE_FUNCTIONAL_TEST, KUBERNETES, ERROR_MESSAGES } = require('../../common/consts'),
    generateError = require('../../common/generateError'),
    { version: PREDATOR_VERSION } = require('../../../package.json');

let jobConnector;
const cronJobs = {};
const PREDATOR_RUNNER_PREFIX = 'predator';
const JOB_PLATFORM_NAME = PREDATOR_RUNNER_PREFIX + '.%s';

module.exports.init = async () => {
    const jobPlatform = await configHandler.getConfigValue(CONFIG.JOB_PLATFORM);
    jobConnector = require(`./${jobPlatform.toLowerCase()}/jobConnector`);
};

module.exports.reloadCronJobs = async () => {
    const contextId = httpContext.get(CONTEXT_ID);
    const configData = await configHandler.getConfig();
    try {
        const jobs = await databaseConnector.getJobs(contextId);
        jobs.forEach(async function (job) {
            if (job.cron_expression !== null) {
                addCron(job, job.cron_expression, configData);
            }
        });
    } catch (error) {
        throw new Error('Unable to reload scheduled jobs, error: ' + error);
    }
};

module.exports.scheduleFinishedContainersCleanup = async () => {
    const interval = await configHandler.getConfigValue(CONFIG.INTERVAL_CLEANUP_FINISHED_CONTAINERS_MS);
    if (interval > 0) {
        logger.info(`Setting containers clean up with interval of ${interval}`);
        return setInterval(async () => {
            logger.info('starting scheduled container deletion');
            const deleteResult = await jobConnector.deleteAllContainers(PREDATOR_RUNNER_PREFIX);
            logger.info('finished scheduled container deletion', deleteResult);
        }, interval);
    }
};

module.exports.createJob = async (job) => {
    const contextId = httpContext.get(CONTEXT_ID);
    let report;
    const jobId = uuid.v4();
    const configData = await configHandler.getConfig();
    await validateWebhooksAssignment(job.webhooks);
    validateExperimentsValidForEnv(job, configData);
    try {
        const insertedJob = await databaseConnector.insertJob(jobId, job, contextId);
        logger.info('Job saved successfully to database');
        if (job.run_immediately) {
            report = await runJob(insertedJob, configData);
        }
        if (job.cron_expression) {
            report = { report_id: undefined };
            addCron(insertedJob, job.cron_expression, configData);
        }
        logger.info(`Job ${jobId} deployed successfully`);
        const jobResponse = createResponse(jobId, job, report);
        if (job.run_immediately) {
            produceJobToStreamingPlatform(jobResponse);
        }

        return jobResponse;
    } catch (error) {
        logger.error(error, 'Error occurred trying to create new job');
        throw error;
    }
};

module.exports.deleteJob = (jobId) => {
    const contextId = httpContext.get(CONTEXT_ID);
    if (cronJobs[jobId]) {
        cronJobs[jobId].stop();
        delete cronJobs[jobId];
    }
    return databaseConnector.deleteJob(jobId, contextId);
};

module.exports.stopRun = async (jobId, reportId) => {
    const job = await getJobInternal(jobId);
    await jobConnector.stopRun(util.format(JOB_PLATFORM_NAME, reportId), job);
};

module.exports.deleteAllContainers = async () => {
    const result = await jobConnector.deleteAllContainers(PREDATOR_RUNNER_PREFIX);
    return result;
};

module.exports.getLogs = async function (jobId, reportId) {
    await getJobInternal(jobId);
    const logs = await jobConnector.getLogs(util.format(JOB_PLATFORM_NAME, reportId), PREDATOR_RUNNER_PREFIX);
    const response = {
        files: logs,
        filename: `${jobId}-${reportId}.zip`
    };
    return response;
};

module.exports.getJobs = async (getOneTimeJobs) => {
    const contextId = httpContext.get(CONTEXT_ID);
    try {
        let jobs = await databaseConnector.getJobs(contextId);
        logger.info('Got jobs list from database successfully');
        if (!getOneTimeJobs) {
            jobs = jobs.filter((job) => job.cron_expression);
        }
        const jobsResponse = jobs.map((job) => {
            return createResponse(job.id, job);
        });

        return jobsResponse;
    } catch (error) {
        logger.error(error, 'Error occurred trying to get jobs');
        return Promise.reject(error);
    }
};

module.exports.getJob = async (jobId) => {
    return getJobInternal(jobId);
};

module.exports.updateJob = async (jobId, jobConfig) => {
    const contextId = httpContext.get(CONTEXT_ID);
    const configData = await configHandler.getConfig();
    await validateWebhooksAssignment(jobConfig.webhooks);
    validateExperimentsValidForEnv(jobConfig, configData);
    let [job] = await databaseConnector.getJob(jobId, contextId);
    if (!job || job.length === 0) {
        const error = new Error('Not found');
        error.statusCode = 404;
        throw error;
    }
    if (!job.cron_expression) {
        const error = new Error('Can not update jobs from type run_immediately: true');
        error.statusCode = 422;
        throw error;
    }
    try {
        await databaseConnector.updateJob(jobId, jobConfig);
        job = await databaseConnector.getJob(jobId, contextId);
    } catch (err) {
        logger.error(err, 'Error occurred trying to update job');
        throw err;
    }
    if (cronJobs[jobId]) {
        cronJobs[jobId].stop();
        delete cronJobs[jobId];
    }
    addCron(job[0], job[0].cron_expression, configData);
    logger.info('Job updated successfully to database');
};

module.exports.getJobBasedOnTestId = async (testId) => {
    try {
        const jobs = await databaseConnector.getJobBasedOnTestId(testId);
        const jobsResponse = jobs.map((job) => {
            return createResponse(job.id, job);
        });
        return jobsResponse;
    } catch (error) {
        logger.error(error, 'Error occurred trying to get job based on test id');
        throw error;
    }
};

function createResponse(jobId, jobBody, report) {
    const response = {
        id: jobId,
        test_id: jobBody.test_id,
        type: jobBody.type,
        start_time: report ? report.start_time : undefined,
        cron_expression: jobBody.cron_expression,
        webhooks: jobBody.webhooks,
        emails: jobBody.emails,
        ramp_to: jobBody.ramp_to,
        parallelism: jobBody.parallelism,
        max_virtual_users: jobBody.max_virtual_users,
        custom_env_vars: jobBody.custom_env_vars,
        report_id: report ? report.report_id : undefined,
        arrival_rate: jobBody.arrival_rate,
        arrival_count: jobBody.arrival_count,
        duration: jobBody.duration,
        environment: jobBody.environment || 'test',
        notes: jobBody.notes,
        proxy_url: jobBody.proxy_url,
        experiments: jobBody.experiments,
        debug: jobBody.debug,
        enabled: jobBody.enabled !== false,
        tag: jobBody.tag
    };

    return response;
}

async function createJobRequest(jobId, reportId, jobBody, dockerImage, configData) {
    const jobTemplate = require(`./${configData.job_platform.toLowerCase()}/jobTemplate`);
    const jobPlatformName = util.format(JOB_PLATFORM_NAME, reportId);
    let maxVirtualUsersPerRunner = jobBody.max_virtual_users;
    const parallelism = jobBody.parallelism || 1;
    const environmentVariables = {
        JOB_ID: jobId,
        JOB_TYPE: jobBody.type,
        ENVIRONMENT: jobBody.environment,
        TEST_ID: jobBody.test_id,
        PREDATOR_URL: configData.internal_address,
        DELAY_RUNNER_MS: configData.delay_runner_ms.toString(),
        DURATION: jobBody.duration.toString(),
        REPORT_ID: reportId,
        PREDATOR_VERSION
    };
    if (jobBody.type === JOB_TYPE_FUNCTIONAL_TEST) {
        const arrivalCountPerRunner = Math.ceil(jobBody.arrival_count / parallelism);
        environmentVariables.ARRIVAL_COUNT = arrivalCountPerRunner.toString();
    } else {
        const arrivalRatePerRunner = Math.ceil(jobBody.arrival_rate / parallelism);
        environmentVariables.ARRIVAL_RATE = arrivalRatePerRunner.toString();
        if (jobBody.ramp_to) {
            const rampToPerRunner = Math.ceil(jobBody.ramp_to / parallelism);
            environmentVariables.RAMP_TO = rampToPerRunner.toString();
        }
    }
    if (jobBody.max_virtual_users) {
        maxVirtualUsersPerRunner = Math.ceil(jobBody.max_virtual_users / parallelism);
    }

    let metricsExport = configData.metrics_plugin_name === 'influx' ? configData.influx_metrics : configData.prometheus_metrics;

    if (configData.metrics_plugin_name && metricsExport) {
        environmentVariables.METRICS_PLUGIN_NAME = configData.metrics_plugin_name;
        if (typeof metricsExport === 'object') {
            metricsExport = JSON.stringify(metricsExport);
        }
        environmentVariables.METRICS_EXPORT_CONFIG = Buffer.from(metricsExport).toString('base64');
    }

    if (configData.allow_insecure_tls) {
        environmentVariables.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    }

    if (jobBody.proxy_url) {
        environmentVariables.PROXY_URL = jobBody.proxy_url;
    }
    if (jobBody.debug) {
        environmentVariables.DEBUG = jobBody.debug;
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

    const customRunnerDefinition = configData.custom_runner_definition;
    const jobRequest = jobTemplate.createJobRequest(jobPlatformName, reportId, parallelism, environmentVariables, dockerImage, configData, PREDATOR_RUNNER_PREFIX, customRunnerDefinition, jobBody.tag);

    return jobRequest;
}

function addCron(job, cronExpression, configData) {
    const scheduledJob = new CronJob(cronExpression, async function () {
        if (job.enabled === false) {
            logger.info(`Skipping job with id: ${job.id} as it's currently disabled`);
            return;
        }
        const report = await runJob(job, configData);
        const jobResponse = createResponse(job.id, job, report);
        produceJobToStreamingPlatform(jobResponse);
    }, function () {
        logger.info(`Job: ${job.id} completed.`);
    }, true);
    cronJobs[job.id] = scheduledJob;
}

function validateExperimentsValidForEnv(job, config) {
    if (job.experiments && job.experiments.length > 0 && config.job_platform.toUpperCase() !== KUBERNETES){
        throw generateError(400, ERROR_MESSAGES.CHAOS_EXPERIMENT_SUPPORTED_ONLY_IN_KUBERNETES);
    }
}

async function validateWebhooksAssignment(webhookIds) {
    let webhooks = [];
    if (webhookIds && webhookIds.length > 0) {
        try {
            webhooks = await Promise.all(webhookIds.map(webhookId => webhooksManager.getWebhook(webhookId)));
        } catch (err) {
            let error;
            if (err.statusCode === 404) {
                error = generateError(400, 'At least one of the webhooks does not exist');
                throw error;
            } else {
                error = generateError(500);
            }
            throw error;
        }
    }
    if (webhooks.some(webhook => webhook.global)) {
        const error = generateError(422, 'Assigning a global webhook to a job is not allowed');
        throw error;
    }
}

async function createReportForJob(test, job) {
    const reportId = uuid.v4();
    const startTime = Date.now();
    const report = await reportsManager.postReport(reportId, test, job, startTime);
    logger.info({ test_id: test.id, report_id: reportId }, 'Created report successfully');
    return report;
}

async function getJobInternal(jobId) {
    const contextId = httpContext.get(CONTEXT_ID);
    try {
        let error;
        const job = await databaseConnector.getJob(jobId, contextId);
        logger.info('Got job from database successfully');
        if (job.length > 1) {
            logger.error('database returned ' + job.length + ' rows, expected only one.');
            error = new Error('Error occurred in database response');
            error.statusCode = 500;
            throw error;
        } else if (job.length === 1) {
            return createResponse(job[0].id, job[0]);
        } else {
            error = new Error('Not found');
            error.statusCode = 404;
            return Promise.reject(error);
        }
    } catch (error) {
        logger.error(error, 'Error occurred trying to get job');
        throw error;
    }
}

async function failReport(report) {
    if (!report) {
        return;
    }
    logger.info('Removing the failed job report');
    return reportsManager.failReport(report);
}

async function runJob(job, configData) {
    let report;
    try {
        const latestDockerImage = await dockerHubConnector.getMostRecentRunnerTag();
        const test = await testsManager.getTest(job.test_id);
        report = await createReportForJob(test, job);
        const jobSpecificPlatformRequest = await createJobRequest(job.id, report.report_id, job, latestDockerImage, configData);
        await jobConnector.runJob(jobSpecificPlatformRequest, job);
    } catch (error) {
        logger.error({ id: job.id, error: error }, 'Unable to run scheduled job.');
        await failReport(report);
        throw error;
    }
    return report;
}

function produceJobToStreamingPlatform(jobResponse) {
    const streamingResource = {
        job_id: jobResponse.id,
        job_type: jobResponse.type,
        ...jobResponse
    };
    streamingManager.produce({}, STREAMING_EVENT_TYPES.JOB_CREATED, streamingResource);
}
