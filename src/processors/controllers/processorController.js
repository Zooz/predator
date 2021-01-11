'use strict';
const processorManager = require('../models/processorsManager');

module.exports.createProcessor = function (req, res) {
    return processorManager.createProcessor(req.body, req.requestContext)
        .then(function (result) {
            res.code(201).send(result);
        })
        .catch(function (err) {
            res.send(err);
        });
};

module.exports.getAllProcessors = async function (req, res) {
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
};

module.exports.getProcessor = async function (req, res) {
    let processor;
    const processorId = req.params.processor_id;
    try {
        processor = await processorManager.getProcessor(processorId, req.requestContext);
        res.code(200).send(processor);
    } catch (err) {
        res.send(err);
    }
};

module.exports.deleteProcessor = async function (req, res) {
    const { params: { processor_id: processorId } } = req;
    try {
        await processorManager.deleteProcessor(processorId, req.requestContext, req.log);
        res.code(204).send();
    } catch (err) {
        res.send(err);
    }
};

module.exports.updateProcessor = async function (req, res) {
    const { body: updatedProcessor, params: { processor_id: processorId } } = req;
    try {
        const processor = await processorManager.updateProcessor(processorId, updatedProcessor, req.requestContext);
        res.code(200).send(processor);
    } catch (e) {
        res.send(e);
    }
};
