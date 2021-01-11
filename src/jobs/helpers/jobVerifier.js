'use strict';
const testsManager = require('../../tests/models/manager');
const CronTime = require('cron').CronTime;
const configHandler = require('../../configManager/models/configHandler');
const consts = require('../../common/consts');

/**
 * Validates a cron expression and returns error message if the expression is invalid
 * @param {string} exp
 * @returns {(string|undefined)} Error message if the expression is invalid
 */
function verifyCronExpression(exp) {
    try {
        new CronTime(exp);
    } catch (err) {
        return err.message;
    }
}

module.exports.verifyJobBody = async (req, res) => {
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
            throw errorToThrow;
        } else if (!customRunnerDefinition[jobBody.tag]) {
            errorToThrow = new Error(`custom_runner_definition is missing key for tag: ${jobBody.tag}`);
            errorToThrow.statusCode = 400;
            throw errorToThrow;
        }
    }
};

module.exports.verifyTestExists = async (req, res) => {
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
            throw errorToThrow;
        }
    }
};
