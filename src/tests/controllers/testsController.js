'use strict';

const manager = require('../models/manager');

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
        await manager.deleteTest(req.params.test_id, req.body);
        return res.status(200).json();
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
