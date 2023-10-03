'use strict';

const httpContext = require('express-http-context'),
    uuid = require('uuid');

const logger = require('../../common/logger'),
    databaseConnector = require('./database/databaseConnector'),
    kubernetesConnector = require('./kubernetes/chaosExperimentConnector'),
    { ERROR_MESSAGES, CONTEXT_ID, CONFIG } = require('../../common/consts'),
    generateError = require('../../common/generateError'),
    configHandler = require('../../configManager/models/configHandler');

module.exports.scheduleFinishedResourcesCleanup = async function () {
    const interval = await configHandler.getConfigValue(CONFIG.INTERVAL_CLEANUP_FINISHED_CONTAINERS_MS);
    const deletionTimeThreshold = await configHandler.getConfigValue(CONFIG.MINIMUM_WAIT_FOR_CHAOS_EXPERIMENT_DELETION_IN_MS);
    await kubernetesConnector.scheduleFinishedResourcesCleanup(interval, deletionTimeThreshold);
};

module.exports.createChaosExperiment = async function (chaosExperiment) {
    const contextId = httpContext.get(CONTEXT_ID);

    const chaosExperimentWithTheSameName = await databaseConnector.getChaosExperimentByName(chaosExperiment.name, contextId);
    if (chaosExperimentWithTheSameName) {
        throw generateError(400, ERROR_MESSAGES.CHAOS_EXPERIMENT_NAME_ALREADY_EXIST);
    }
    const experimentId = uuid.v4();
    try {
        await databaseConnector.insertChaosExperiment(experimentId, chaosExperiment, contextId);
        chaosExperiment.id = experimentId;
        logger.info('chaos experiment saved successfully to database');
        return chaosExperiment;
    } catch (error) {
        logger.error(error, 'Error occurred trying to create new chaos experiment');
        return Promise.reject(error);
    }
};

module.exports.getAllChaosExperiments = async function (from, limit, exclude) {
    const contextId = httpContext.get(CONTEXT_ID);

    const allChaosExperiments = await databaseConnector.getAllChaosExperiments(from, limit, exclude, contextId);
    return allChaosExperiments;
};

module.exports.getChaosExperimentById = async function (experimentId) {
    const contextId = httpContext.get(CONTEXT_ID);

    const processor = await databaseConnector.getChaosExperimentById(experimentId, contextId);
    if (processor) {
        return processor;
    } else {
        const error = generateError(404, ERROR_MESSAGES.NOT_FOUND);
        throw error;
    }
};

module.exports.getChaosExperimentsByIds = (experimentIds, exclude, contextId) => {
    return databaseConnector.getChaosExperimentsByIds(experimentIds, exclude, contextId);
};

module.exports.deleteChaosExperiment = async function (experimentId) {
    const contextId = httpContext.get(CONTEXT_ID);

    const chaosExperiment = await databaseConnector.getChaosExperimentById(experimentId, contextId);
    if (!chaosExperiment) {
        throw generateError(404, ERROR_MESSAGES.NOT_FOUND);
    }

    return databaseConnector.deleteChaosExperiment(experimentId);
};

module.exports.updateChaosExperiment = async function (experimentId, chaosExperiment) {
    const contextId = httpContext.get(CONTEXT_ID);

    const oldChaosExperiment = await databaseConnector.getChaosExperimentById(experimentId, contextId);
    if (!oldChaosExperiment) {
        throw generateError(404, ERROR_MESSAGES.NOT_FOUND);
    }
    const chaosExperimentWithTheSameName = await databaseConnector.getChaosExperimentByName(chaosExperiment.name, contextId);
    if (chaosExperimentWithTheSameName && chaosExperimentWithTheSameName.id !== experimentId) {
        throw generateError(400, ERROR_MESSAGES.CHAOS_EXPERIMENT_NAME_ALREADY_EXIST);
    }

    await databaseConnector.updateChaosExperiment(experimentId, chaosExperiment);
    return chaosExperiment;
};

module.exports.insertChaosJobExperiment = async (jobExperimentId, jobId, experimentId, startTime, endTime, contextId) => {
    await databaseConnector.insertChaosJobExperiment(jobExperimentId, jobId, experimentId, startTime, endTime, contextId);
};

module.exports.runChaosExperiment = async (kubernetesChaosConfig, jobExperimentId) => {
    try {
        await kubernetesConnector.runChaosExperiment(kubernetesChaosConfig);
        await databaseConnector.setChaosJobExperimentTriggered(jobExperimentId, true);
    } catch (error){
        logger.error(error, `Error while running chaos job experiment ${jobExperimentId}`);
    }
};

module.exports.getFutureJobExperiments = async function (timestamp, contextId) {
    return databaseConnector.getFutureJobExperiments(contextId);
};
