'use strict';
const jobManager = require('../models/jobManager');

async function createJob(req, res) {
    try {
        let result = await jobManager.createJob(req.body);
        res.code(201).send(result);
    } catch (err) {
        res.send(err);
    }
}

async function getJobs(req, res) {
    const shouldGetAllJobs = (req.query && (req.query.one_time === true || req.query.one_time === 'true'));
    try {
        let result = await jobManager.getJobs(shouldGetAllJobs, req.requestContext);
        res.code(200).send(result);
    } catch (err) {
        res.send(err);
    }
}

async function getJob(req, res) {
    try {
        let result = await jobManager.getJob(req.params.job_id, req.requestContext);
        res.code(200).send(result);
    } catch (err) {
        res.send(err);
    }
}

async function updateJob(req, res) {
    try {
        let result = await jobManager.updateJob(req.params.job_id, req.body, req.requestContext);
        res.code(200).send(result);
    } catch (err) {
        res.send(err);
    }
}

async function deleteJob(req, res) {
    try {
        await jobManager.deleteJob(req.params.job_id, req.requestContext);
        res.code(204).send();
    } catch (err) {
        res.send(err);
    }
}

async function stopRun(req, res) {
    try {
        await jobManager.stopRun(req.params.job_id, req.params.report_id);
        res.code(204).send();
    } catch (err) {
        res.send(err);
    }
}

async function getLogs(req, res) {
    try {
        let result = await jobManager.getLogs(req.params.job_id, req.params.report_id);
        //TODO: fix ZIP creation
        // return res.zip(result);
    } catch (err) {
        res.send(err);
    }
}

async function deleteAllContainers(req, res) {
    try {
        let result = await jobManager.deleteAllContainers();
        res.code(200).send(result);
    } catch (err) {
        res.send(err);
    }
}

module.exports = {
    createJob,
    getJobs,
    getJob,
    updateJob,
    deleteJob,
    stopRun,
    getLogs,
    deleteAllContainers
}