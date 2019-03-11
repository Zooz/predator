'use strict';

const manager = require('../models/manager');

module.exports = {
    upsertTest,
    getTest,
    deleteTest,
    getTests,
    getFile,
    downloadFile,
    getTestRevisions
};

async function upsertTest(req, res, next) {
    try {
        const result = await manager.upsertTest(req.body, req.params.test_id);
        return res.status(201).json(result);
    } catch (err){
        return next(err);
    }
}

async function getFile(req, res, next) {
    try {
        const result = await manager.getFile(req.params.file_id);
        return res.status(200).json(result);
    } catch (err) {
        return next(err);
    }
}
async function downloadFile(req, res, next) {
    try {
        const result = await manager.saveFileToDbUsingUrl('https://www.dropbox.com/s/dffgjbojwrlz55o/fuleuPLOAD.rtf?dl=1');
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
