'use strict';

const uuid = require('uuid');

const logger = require('../../common/logger'),
    databaseConnector = require('./database/databaseConnector'),
    {
        ERROR_MESSAGES, CONFIG, KUBERNETES,
        PREDATOR_RUNNER_PREFIX,
        CHAOS_EXPERIMENT_LABELS
    } = require('../../common/consts'),
    generateError = require('../../common/generateError'),
    configHandler = require('../../configManager/models/configHandler'),
    { getContextId } = require('../../common/context/contextUtil');

let connector, jobExperimentHandler;

module.exports.clearAllFinishedResources = async function() {
    return await connector.clearAllFinishedResources();
};

module.exports.createChaosExperiment = async function (chaosExperiment) {
    const contextId = getContextId();

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
    const contextId = getContextId();

    const allChaosExperiments = await databaseConnector.getAllChaosExperiments(from, limit, exclude, contextId);
    return allChaosExperiments;
};

const getChaosExperimentById = module.exports.getChaosExperimentById = async function (experimentId) {
    const contextId = getContextId();
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
    const contextId = getContextId();

    const chaosExperiment = await databaseConnector.getChaosExperimentById(experimentId, contextId);
    if (!chaosExperiment) {
        throw generateError(404, ERROR_MESSAGES.NOT_FOUND);
    }

    return databaseConnector.deleteChaosExperiment(experimentId);
};

module.exports.updateChaosExperiment = async function (experimentId, chaosExperiment) {
    const contextId = getContextId();

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
    const contextId = getContextId();
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
    if (jobPlatform.toUpperCase() !== KUBERNETES) return;
    const platform = jobPlatform.toLowerCase();
    connector = require(`./${platform}/chaosExperimentConnector`);
    jobExperimentHandler = require(`./../../jobs/models/${platform}/jobExperimentsHandler`);
    return jobPlatform;
};

module.exports.init = async function () {
    const platform = await setPlatform();
    if (!platform) return;
    await connector.init();
    await reloadChaosExperiments();
};

const stopResourcesOfJobIdAndExperiment = async (jobId, kind, namespace) => {
    try {
        await connector.deleteAllResourcesOfKindAndJob(kind, namespace, jobId);
    } catch (e){
        logger.error(`Failed to get resources of kind ${kind} of jobId ${jobId}: ${e}`);
    }
};

module.exports.stopJobExperimentsByJobId = async function(jobId) {
    try {
        const jobExperiments = await getChaosJobExperimentsByJobId(jobId);
        const experimentIds = [...new Set(jobExperiments.map(jobExperiment => jobExperiment.experiment_id))];
        const experiments = await getChaosExperimentsByIds(experimentIds);
        const kindNamespaceStrings = [...new Set(experiments.map(ex => `${ex.kubeObject.kind}_${ex.kubeObject.metadata.namespace}`))];
        await Promise.all(kindNamespaceStrings.map(async(kindNamespaceString) => {
            const splittedString = kindNamespaceString.split('_');
            await stopResourcesOfJobIdAndExperiment(jobId, splittedString[0], splittedString[1]);
        }
        ));
    } catch (e) {
        logger.error(`Error while trying to stop job experiments for job ${jobId} : ${e}`);
    }
};
