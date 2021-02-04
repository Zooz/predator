'use strict';
const processorManager = require('../models/processorsManager');

async function createProcessor(req, res) {
    try {
        let result = processorManager.createProcessor(req.body, req.requestContext);
        res.code(201).send(result);
    } catch (err) {
        res.send(err);
    }
}

async function getAllProcessors(req, res) {
    let { query: { from = "0", limit = "100" } } = req;
    let processors;
    try {
        from = parseInt(from);
        limit = parseInt(limit);
        processors = await processorManager.getAllProcessors(from, limit, req.query.exclude, req.requestContext);
        res.code(200).send(processors);
    } catch (err) {
        res.send(err);
    }
}

async function getProcessor(req, res) {
    let processor;
    const processorId = req.params.processor_id;
    try {
        processor = await processorManager.getProcessor(processorId, req.requestContext);
        res.code(200).send(processor);
    } catch (err) {
        res.send(err);
    }
}

async function deleteProcessor(req, res) {
    const { params: { processor_id: processorId } } = req;
    try {
        await processorManager.deleteProcessor(processorId, req.requestContext, req.log);
        res.code(204).send();
    } catch (err) {
        res.send(err);
    }
}

async function updateProcessor(req, res) {
    const { body: updatedProcessor, params: { processor_id: processorId } } = req;
    try {
        const processor = await processorManager.updateProcessor(processorId, updatedProcessor, req.requestContext);
        res.code(200).send(processor);
    } catch (e) {
        res.send(e);
    }
}

module.exports = {
    createProcessor,
    getAllProcessors,
    getProcessor,
    deleteProcessor,
    updateProcessor
}