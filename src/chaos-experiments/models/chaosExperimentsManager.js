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

async function clearAllFinishedResources() {
    return await connector.clearAllFinishedResources();
};

async function createChaosExperiment(chaosExperiment) {
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

async function getAllChaosExperiments(from, limit, exclude) {
    const contextId = httpContext.get(CONTEXT_ID);

    const allChaosExperiments = await databaseConnector.getAllChaosExperiments(from, limit, exclude, contextId);
    return allChaosExperiments;
};

async function getChaosExperimentById(experimentId) {
    const contextId = httpContext.get(CONTEXT_ID);
    const processor = await databaseConnector.getChaosExperimentById(experimentId, contextId);
    if (processor) {
        return processor;
    } else {
        const error = generateError(404, ERROR_MESSAGES.NOT_FOUND);
        throw error;
    }
};

function getChaosExperimentsByIds(experimentIds, exclude, contextId) {
    return databaseConnector.getChaosExperimentsByIds(experimentIds, exclude, contextId);
};

async function deleteChaosExperiment (experimentId) {
    const contextId = httpContext.get(CONTEXT_ID);

    const chaosExperiment = await databaseConnector.getChaosExperimentById(experimentId, contextId);
    if (!chaosExperiment) {
        throw generateError(404, ERROR_MESSAGES.NOT_FOUND);
    }

    return databaseConnector.deleteChaosExperiment(experimentId);
};

async function updateChaosExperiment(experimentId, chaosExperiment) {
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
async function insertChaosJobExperiment(jobExperimentId, jobId, experimentId, startTime, endTime, contextId) {
    await databaseConnector.insertChaosJobExperiment(jobExperimentId, jobId, experimentId, startTime, endTime, contextId);
};

const runChaosExperiment = async (kubernetesChaosConfig, jobId, jobExperimentId) => {
    try {
        const mappedKubernetesChaosConfig = buildExperimentResource(kubernetesChaosConfig, jobId);
        await connector.runChaosExperiment(mappedKubernetesChaosConfig);
        await databaseConnector.setChaosJobExperimentTriggered(jobExperimentId, true);
    } catch (error){
        logger.error(error, `Error while running chaos job experiment ${jobExperimentId}`);
    }
};

async function getChaosJobExperimentsByJobId(jobId, contextId) {
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

async function getFutureJobExperiments(timestamp, contextId) {
    return databaseConnector.getFutureJobExperiments(timestamp, contextId);
};

async function reloadSingleChaosExperiment(futureJobExperiment, timestamp){
    try {
        const calculatedStartAfter = futureJobExperiment.start_time - timestamp;
        const chaosExperiment = await getChaosExperimentById(futureJobExperiment.experiment_id);
        jobExperimentHandler.scheduleChaosExperiment(chaosExperiment.kubeObject, futureJobExperiment.job_id, futureJobExperiment.id, calculatedStartAfter);
    } catch (error) {
        throw new Error('Unable to reload job experiments ' + futureJobExperiment.id + ' , error: ' + error);
    }
};

async function reloadChaosExperiments() {
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

async function setPlatform() {
    const jobPlatform = await configHandler.getConfigValue(CONFIG.JOB_PLATFORM);
    if (jobPlatform.toUpperCase() !== KUBERNETES) return;
    const platform = jobPlatform.toLowerCase();
    connector = require(`./${platform}/chaosExperimentConnector`);
    jobExperimentHandler = require(`./../../jobs/models/${platform}/jobExperimentsHandler`);
    return jobPlatform;
};

async function init() {
    const platform = await setPlatform();
    if (!platform) return;
    await reloadChaosExperiments();
};

async function stopResourcesOfJobIdAndExperiment(jobId, kind, namespace) {
    try {
        await connector.deleteAllResourcesOfKindAndJob(kind, namespace, jobId);
    } catch (e){
        logger.error(`Failed to get resources of kind ${kind} of jobId ${jobId}: ${e}`);
    }
};

async function stopJobExperimentsByJobId(jobId) {
    try {
        const jobExperiments = await getChaosJobExperimentsByJobId(jobId);
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
    } catch (e) {
        logger.error(`Error while trying to stop job experiments for job ${jobId} : ${e}`);
    }
};

module.exports = {
    init,
    clearAllFinishedResources,
    createChaosExperiment,
    getAllChaosExperiments,
    deleteChaosExperiment,
    updateChaosExperiment,
    insertChaosJobExperiment,
    runChaosExperiment,
    getChaosJobExperimentsByJobId,
    reloadChaosExperiments,
    setPlatform,
    getChaosExperimentById,
    getChaosExperimentsByIds,
    stopJobExperimentsByJobId
};
