
const chaosExperimentsDbConnector = require('../../chaos-experiments/models/database/databaseConnector'),
    chaosExperimentManager = require('../../chaos-experiments/models/chaosExperimentsManager'),
    { v4: uuid } = require('uuid'),
    logger = require('../../common/logger');

const SEC_TO_MS = 1000;
const MIN_TO_MS = 60 * 1000;
const HOUR_TO_MS = 60 * 1000;
const DAY_TO_MS = 60 * 1000;
const jobExperimentsIdToTimeout = new Map();

async function setChaosExperimentsIfExist(jobId, jobExperiments) {
    if (!jobExperiments) {
        return;
    }
    try {
        const baseTimestamp = Date.now();
        const experimentIds = jobExperiments.map(experiment => experiment.experiment_id);
        const experimentsFromDb = await chaosExperimentManager.getChaosExperimentsByIds(experimentIds);
        await Promise.all(jobExperiments.map(async(experimentRequest) =>
            await setSingleJobExperiment(experimentRequest, experimentsFromDb, baseTimestamp, jobId)
        ));
    } catch (error){
        logger.error(error, `error while setting chaos experiments for job ${jobId}`);
    }
};

async function setSingleJobExperiment(experimentRequest, experimentsFromDb, baseTimestamp, jobId) {
    try {
        const experiment = experimentsFromDb.find(e => e.id === experimentRequest.experiment_id);
        const startTime = baseTimestamp + experimentRequest.start_after;
        const endTime = startTime + convertDurationStringToMillisecond(experiment.kubeObject.spec.duration);
        const jobExperimentId = uuid();
        await chaosExperimentManager.insertChaosJobExperiment(jobExperimentId, jobId, experiment.id, startTime, endTime);
        const kubeObject = experiment.kubeObject;
        kubeObject.name = kubeObject.metadata.name.concat(`_${jobExperimentId}`);
        const timeout = setTimeout(() => chaosExperimentManager.runChaosExperiment(kubeObject, jobExperimentId), experimentRequest.start_after);
        jobExperimentsIdToTimeout.set(jobExperimentId, timeout);
    } catch (error){
        logger.error(error, `error while setting chaos experiment ${experimentRequest.experiment_id} for job ${jobId}`);
    }
}

function convertDurationStringToMillisecond(durationString) {
    if (durationString.endsWith('s')){
        return durationString.split('s')[0] * SEC_TO_MS;
    }
    if (durationString.endsWith('m')){
        return durationString.split('m')[0] * MIN_TO_MS;
    }
    if (durationString.endsWith('h')){
        return durationString.split('h')[0] * HOUR_TO_MS;
    }
    if (durationString.endsWith('d')){
        return durationString.split('h')[0] * DAY_TO_MS;
    }
    return durationString.split('ms')[0];
}

module.exports = {
    jobExperimentsIdToTimeout,
    setChaosExperimentsIfExist
};