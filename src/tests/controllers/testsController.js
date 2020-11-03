'use strict';

const manager = require('../models/manager');
const jobManager = require('../../jobs/models/jobManager');

module.exports = {
    upsertTest,
    getTest,
    deleteTest,
    getTests,
    getTestRevisions,
    insertTestBenchmark,
    getBenchmark
};

async function insertTestBenchmark(req, res, next) {
    try {
        const result = await manager.insertTestBenchmark(req.body, req.params.test_id);
        return res.status(201).json(result);
    } catch (err){
        return next(err);
    }
}
async function getBenchmark(req, res, next) {
    try {
        const result = await manager.getBenchmark(req.params.test_id);
        return res.status(200).json(result);
    } catch (err){
        return next(err);
    }
}

async function upsertTest(req, res, next) {
    try {
        const result = await manager.upsertTest(req.body, req.params.test_id);
        return res.status(201).json(result);
    } catch (err){
        return next(err);
    }
}

async function getTest(req, res, next) {
    try {
        const result = await manager.getTest(req.params.test_id);
        return res.status(200).json(result);
    } catch (err){
        return next(err);
    }
}

async function deleteTest(req, res, next) {
    try {
        const testsJobs = await jobManager.getJobBasedOnTestId(req.params.test_id);
        let hasCronScheduledJob = testsJobs.some(job => job.hasOwnProperty('cron_expression'));
        if (hasCronScheduledJob) {
            const error = 'Please delete all scheduled jobs for the test before deleting the test';
            return res.status(409).json({ message: error });
        } else {
            await manager.deleteTest(req.params.test_id, req.body);
            return res.status(200).json();
        }
    } catch (err){
        return next(err);
    }
}

async function getTests(req, res, next) {
    try {
        const result = await manager.getTests();
        return res.status(200).json(result);
    } catch (err) {
        return next(err);
    }
}

async function getTestRevisions(req, res, next) {
    try {
        const result = await manager.getAllTestRevisions(req.params.test_id);
        return res.status(200).json(result);
    } catch (err){
        return next(err);
    }
}
