
const chaosExperimentsManager = require('../../../chaos-experiments/models/chaosExperimentsManager'),
    { v4: uuid } = require('uuid'),
    logger = require('../../../common/logger');

const SEC_TO_MS = 1000;
const MIN_TO_MS = 60 * 1000;
const HOUR_TO_MS = 60 * 1000;
const DAY_TO_MS = 60 * 1000;
const jobIdsToTimeouts = new Map();

async function setChaosExperimentsIfExist(jobId, jobExperiments) {
    if (!jobExperiments) {
        return;
    }
    try {
        const baseTimestamp = Date.now();
        const experimentIds = jobExperiments.map(experiment => experiment.experiment_id);
        const chaosExperimentsFromDb = await chaosExperimentsManager.getChaosExperimentsByIds(experimentIds);
        await Promise.all(jobExperiments.map(async(experimentRequest) =>
            await setSingleJobExperiment(experimentRequest, chaosExperimentsFromDb, baseTimestamp, jobId)
        ));
    } catch (error){
        logger.error(error, `error while setting chaos experiments for job ${jobId}`);
    }
};

async function setSingleJobExperiment(experimentRequest, chaosExperimentsFromDb, baseTimestamp, jobId) {
    try {
        const experiment = chaosExperimentsFromDb.find(e => e.id === experimentRequest.experiment_id);
        const startTime = baseTimestamp + experimentRequest.start_after;
        const endTime = startTime + convertDurationStringToMillisecond(experiment.kubeObject.spec.duration);
        const jobExperimentId = uuid();
        await chaosExperimentsManager.insertChaosJobExperiment(jobExperimentId, jobId, experiment.id, startTime, endTime);
        const kubeObject = experiment.kubeObject;
        kubeObject.metadata.name = kubeObject.metadata.name.concat(`-${jobExperimentId}`);
        scheduleChaosExperiment(kubeObject, jobId, jobExperimentId, experimentRequest.start_after);
    } catch (error){
        logger.error(error, `error while setting chaos experiment ${experimentRequest.experiment_id} for job ${jobId}`);
    }
}

function scheduleChaosExperiment(kubeObject, jobId, jobExperimentId, startAfter) {
    const timeout = setTimeout(() => chaosExperimentsManager.runChaosExperiment(kubeObject, jobExperimentId), startAfter);
    const timeoutsArray = jobIdsToTimeouts.get(jobId);
    if (timeoutsArray){
        timeoutsArray.push(timeout);
    } else {
        jobIdsToTimeouts.set(jobId, [timeout]);
    }
}

async function stopChaosExperimentsForJob(jobId){
    const timeoutsOfJob = jobIdsToTimeouts.get(jobId);
    if (!timeoutsOfJob) return;
    timeoutsOfJob.map(timeout => clearTimeout(timeout));
    jobIdsToTimeouts.delete(jobId);
    await chaosExperimentsManager.stopJobExperimentsByJobId(jobId);
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
    setChaosExperimentsIfExist,
    scheduleChaosExperiment,
    stopChaosExperimentsForJob
};
