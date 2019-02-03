'use strict';

let logger = require('../../common/logger');
let manager = require('../models/manager');

module.exports = {
    upsertTest,
    getTest,
    deleteTest,
    getTests,
    getTestRevisions
};

async function upsertTest(req, res) {
    try {
        const result = await manager.upsertTest(req.body, req.params.test_id);
        return res.status(201).json(result);
    } catch (err){
        if (err.statusCode) {
            return res.status(err.statusCode).json({ message: err.message });
        }
        return handleError(err, res);
    }
}

async function getTest(req, res) {
    try {
        const result = await manager.getTest(req.params.test_id);
        return res.status(200).json(result);
    } catch (err){
        if (err.statusCode) {
            return res.status(err.statusCode).json({ message: err.message });
        }
        return handleError(err, res);
    }
}

async function deleteTest(req, res) {
    try {
        await manager.deleteTest(req.params.test_id, req.body);
        return res.status(200).json();
    } catch (err){
        return handleError(err, res);
    }
}

async function getTests(req, res) {
    try {
        const result = await manager.getTests();
        return res.status(200).json(result);
    } catch (err) {
        return handleError(err, res);
    }
}

async function getTestRevisions(req, res) {
    try {
        const result = await manager.getAllTestRevision(req.params.test_id);
        return res.status(200).json(result);
    } catch (err){
        return handleError(err, res);
    }
}

function handleError(err, res) {
    if (err.message === 'Error' || err.message === '' || err.message === undefined) {
        err.message = 'Internal error occurred';
    }
    logger.error(err);
    return res.status(500).json({ message: err.message });
}