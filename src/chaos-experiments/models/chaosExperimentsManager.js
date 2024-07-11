'use strict';

const httpContext = require('express-http-context'),
    uuid = require('uuid');

const logger = require('../../common/logger'),
    databaseConnector = require('./database/databaseConnector'),
    {
        ERROR_MESSAGES, CONTEXT_ID, CONFIG, KUBERNETES,
        PREDATOR_RUNNER_PREFIX,
        CHAOS_EXPERIMENT_LABELS
    } = require('../../common/consts'),
    generateError = require('../../common/generateError'),
    configHandler = require('../../configManager/models/configHandler');

let connector, jobExperimentHandler;

const scheduleFinishedResourcesCleanup = module.exports.scheduleFinishedResourcesCleanup = async function() {
    const interval = await configHandler.getConfigValue(CONFIG.INTERVAL_CLEANUP_FINISHED_CONTAINERS_MS);
    const deletionTimeThreshold = await configHandler.getConfigValue(CONFIG.MINIMUM_WAIT_FOR_CHAOS_EXPERIMENT_DELETION_IN_MS);
    await connector.scheduleFinishedResourcesCleanup(interval, deletionTimeThreshold);
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

const getChaosExperimentById = module.exports.getChaosExperimentById = async function (experimentId) {
    const contextId = httpContext.get(CONTEXT_ID);
    const processor = await databaseConnector.getChaosExperimentById(experimentId, contextId);
    if (processor) {
        return processor;
    } else {
        const error = generateError(404, ERROR_MESSAGES.NOT_FOUND);
        throw error;
    }
};

const getChaosExperimentsByIds = module.exports.getChaosExperimentsByIds = (experimentIds, exclude, contextId) => {
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

module.exports.runChaosExperiment = async (kubernetesChaosConfig, jobId, jobExperimentId) => {
    try {
        const mappedKubernetesChaosConfig = buildExperimentResource(kubernetesChaosConfig, jobId);
        await connector.runChaosExperiment(mappedKubernetesChaosConfig);
        await databaseConnector.setChaosJobExperimentTriggered(jobExperimentId, true);
    } catch (error){
        logger.error(error, `Error while running chaos job experiment ${jobExperimentId}`);
    }
};

const getChaosJobExperimentsByJobId = module.exports.getChaosJobExperimentsByJobId = async function (jobId, contextId) {
    return databaseConnector.getChaosJobExperimentsByJobId(jobId, contextId);
};

const buildExperimentResource = (kubernetesChaosConfig, jobId) => {
    const labels = {
        [CHAOS_EXPERIMENT_LABELS.APP]: PREDATOR_RUNNER_PREFIX,
        [CHAOS_EXPERIMENT_LABELS.JOB_ID]: jobId
    };
    const { metadata = {} } = kubernetesChaosConfig;
    return {
        ...kubernetesChaosConfig,
        metadata: {
            ...metadata,
            labels: {
                ...metadata.labels,
                ...labels
            }
        }
    };
};

const getFutureJobExperiments = async function (timestamp, contextId) {
    return databaseConnector.getFutureJobExperiments(timestamp, contextId);
};

const reloadSingleChaosExperiment = async function (futureJobExperiment, timestamp){
    try {
        const calculatedStartAfter = futureJobExperiment.start_time - timestamp;
        const chaosExperiment = await getChaosExperimentById(futureJobExperiment.experiment_id);
        jobExperimentHandler.scheduleChaosExperiment(chaosExperiment.kubeObject, futureJobExperiment.job_id, futureJobExperiment.id, calculatedStartAfter);
    } catch (error) {
        throw new Error('Unable to reload job experiments ' + futureJobExperiment.id + ' , error: ' + error);
    }
};

const reloadChaosExperiments = module.exports.reloadChaosExperiments = async function() {
    const contextId = httpContext.get(CONTEXT_ID);
    try {
        const timestamp = Date.now();
        const futureJobExperiments = await getFutureJobExperiments(timestamp, contextId);
        for (const futureJobExperiment of futureJobExperiments) {
            await reloadSingleChaosExperiment(futureJobExperiment, timestamp);
        }
    } catch (error) {
        throw new Error('Unable to reload job experiments , error: ' + error);
    }
};

const setPlatform = module.exports.setPlatform = async function () {
    const jobPlatform = await configHandler.getConfigValue(CONFIG.JOB_PLATFORM);
    if (jobPlatform !== KUBERNETES) return;
    const platform = jobPlatform.toLowerCase();
    connector = require(`./${platform}/chaosExperimentConnector`);
    jobExperimentHandler = require(`./../../jobs/models/${platform}/jobExperimentsHandler`);
    return jobPlatform;
};

module.exports.init = async function () {
    const platform = await setPlatform();
    if (!platform) return;
    await reloadChaosExperiments();
    await scheduleFinishedResourcesCleanup();
};

const stopResourcesOfJobIdAndExperiment = async (jobId, kind, namespace) => {
    try {
        const resources = await connector.getAllResourcesOfKindAndJob(kind, namespace, jobId);
        await Promise.all(resources.map(async(resource) => {
            try {
                await connector.deleteResourceOfKind(kind, resource.metadata.name, namespace);
            } catch (e){
                logger.error(`Failed to delete job experiment ${resource.name} of kind ${kind}: ${e}`);
            }
        }));
    } catch (e){
        logger.error(`Failed to get resources of kind ${kind} of jobId ${jobId}: ${e}`);
    }
};

module.exports.stopJobExperimentsByJobId = async function(jobId, contextId) {
    const jobExperiments = await getChaosJobExperimentsByJobId(jobId, contextId);
    const now = Date.now();
    const relevantJobExperiments = jobExperiments.filter(experiment => experiment.start_time <= now);
    const experimentIds = [...new Set(relevantJobExperiments.map(jobExperiment => jobExperiment.experiment_id))];
    const experiments = await getChaosExperimentsByIds(experimentIds);
    const kindNamespaceStrings = [...new Set(experiments.map(ex => `${ex.kubeObject.kind}_${ex.kubeObject.metadata.namespace}`))];
    await Promise.all(kindNamespaceStrings.map(async(kindNamespaceString) => {
        const splittedString = kindNamespaceString.split('_');
        await stopResourcesOfJobIdAndExperiment(jobId, splittedString[0], splittedString[1]);
    }
    ));
};
