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

async function insertTestBenchmark(req, res) {
    try {
        const result = await manager.insertTestBenchmark(req.body, req.params.test_id, req.requestContext);
        res.code(201).send(result);
    } catch (err){
        res.send(err);
    }
}
async function getBenchmark(req, res) {
    try {
        const result = await manager.getBenchmark(req.params.test_id, req.requestContext);
        res.code(200).json(result);
    } catch (err){
        res.send(err);
    }
}

async function upsertTest(req, res) {
    try {
        const result = await manager.upsertTest(req.body, req.params.test_id, req.requestContext);
        res.code(201).send(result);
    } catch (err){
        res.send(err);
    }
}

async function getTest(req, res) {
    try {
        const result = await manager.getTest(req.params.test_id, req.requestContext);
        res.code(200).send(result);
    } catch (err){
        res.send(err);
    }
}

async function deleteTest(req, res) {
    try {
        const testsJobs = await jobManager.getJobBasedOnTestId(req.params.test_id, req.requestContext);
        let hasCronScheduledJob = testsJobs.some(job => job.cron_expression);
        if (hasCronScheduledJob) {
            const error = 'Please delete all scheduled jobs for the test before deleting the test';
            res.code(409).send({ message: error });
        } else {
            await manager.deleteTest(req.params.test_id, req.body);
            res.code(200).send();
        }
    } catch (err){
        res.send(err);
    }
}

async function getTests(req, res) {
    try {
        const result = await manager.getTests(req.query.filter, req.requestContext);
        res.code(200).send(result);
    } catch (err) {
        res.send(err);
    }
}

async function getTestRevisions(req, res) {
    try {
        const result = await manager.getAllTestRevisions(req.params.test_id, req.requestContext);
        res.code(200).send(result);
    } catch (err){
        res.send(err);
    }
}
