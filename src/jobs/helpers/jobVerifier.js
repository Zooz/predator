'use strict';
const testsManager = require('../../tests/models/manager');
const choasExperimentsManager = require('../../chaos-experiments/models/chaosExperimentsManager');
const CronTime = require('cron').CronTime;
const configHandler = require('../../configManager/models/configHandler');
const consts = require('../../common/consts');
const {
    ERROR_MESSAGES,
    KUBERNETES,
    CONFIG
} = require('../../common/consts');

/**
 * Validates a cron expression and returns error message if the expression is invalid
 * @param {string} exp
 * @returns {(string|undefined)} Error message if the expression is invalid
 */
function verifyCronExpression(exp) {
    try {
        // eslint-disable-next-line no-unused-vars
        const _ct = new CronTime(exp);
    } catch (err) {
        return err.message;
    }
}

module.exports.verifyJobBody = async (req, res, next) => {
    let errorToThrow;
    const jobBody = req.body;
    if (!(jobBody.run_immediately || jobBody.cron_expression)) {
        errorToThrow = new Error('Please provide run_immediately or cron_expression in order to schedule a job');
        errorToThrow.statusCode = 400;
    }
    if (jobBody.enabled === false && !jobBody.cron_expression) {
        errorToThrow = new Error('It is impossible to disable job without cron_expression');
        errorToThrow.statusCode = 400;
    }
    if (jobBody.cron_expression) {
        const message = verifyCronExpression(jobBody.cron_expression);
        if (message) {
            errorToThrow = new Error(`Unsupported cron_expression. ${message}`);
            errorToThrow.statusCode = 400;
        }
    }
    const jobPlatform = await configHandler.getConfigValue(consts.CONFIG.JOB_PLATFORM);
    if (jobPlatform === consts.AWS_FARGATE) {
        const customRunnerDefinition = await configHandler.getConfigValue(consts.CONFIG.CUSTOM_RUNNER_DEFINITION);
        if (!jobBody.tag) {
            errorToThrow = new Error('tag must be provided when JOB_PLATFORM is AWS_FARGATE');
            errorToThrow.statusCode = 400;
        } else if (!customRunnerDefinition[jobBody.tag]) {
            errorToThrow = new Error(`custom_runner_definition is missing key for tag: ${jobBody.tag}`);
            errorToThrow.statusCode = 400;
        }
    }

    next(errorToThrow);
};

module.exports.verifyTestExists = async (req, res, next) => {
    let errorToThrow;
    const jobBody = req.body;
    if (jobBody.test_id) {
        try {
            await testsManager.getTest(jobBody.test_id);
        } catch (error) {
            if (error.statusCode === 404) {
                errorToThrow = new Error(`test with id: ${jobBody.test_id} does not exist`);
                errorToThrow.statusCode = 400;
            } else {
                errorToThrow = new Error(error.message);
                errorToThrow.statusCode = 500;
            }
        }
    }
    next(errorToThrow);
};

module.exports.verifyExperimentsExist = async (req, res, next) => {
    const jobBody = req.body;
    let errorToThrow;
    const jobPlatform = await configHandler.getConfigValue(CONFIG.JOB_PLATFORM);
    const experiments = jobBody.experiments;
    if (!experiments || experiments.length === 0) {
        next();
    }
    if (jobPlatform.toUpperCase() !== KUBERNETES){
        errorToThrow = new Error(ERROR_MESSAGES.CHAOS_EXPERIMENT_SUPPORTED_ONLY_IN_KUBERNETES);
        errorToThrow.statusCode = 400;
        next(errorToThrow);
    } else {
        const experimentIds = new Set(experiments.map(experiment => experiment.id));
        const uniqueExperimentIds = Array.from(experimentIds);
        const chaosExperiments = await choasExperimentsManager.getChaosExperimentsByIds(experimentIds, ['kubeObject']);

        if (chaosExperiments.length !== uniqueExperimentIds.length) {
            const errorToThrow = new Error(ERROR_MESSAGES.CHAOS_EXPERIMENTS_NOT_EXIST_FOR_JOB);
            errorToThrow.statusCode = 400;
        }
        next(errorToThrow);
    }
};
