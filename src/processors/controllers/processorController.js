'use strict';
let processorManager = require('../models/processorsManager');

module.exports.createProcessor = function (req, res, next) {
    return processorManager.createProcessor(req.body)
        .then(function (result) {
            return res.status(201).json(result);
        })
        .catch(function (err) {
            return next(err);
        });
};

module.exports.getAllProcessors = async function (req, res, next) {
    let { query: { from = 0, limit = 100 } } = req;
    let processors;
    try {
        from = parseInt(from);
        limit = parseInt(limit);
        processors = await processorManager.getAllProcessors(from, limit);
        return res.status(200).json(processors);
    } catch (err) {
        return next(err);
    }
};

module.exports.getProcessor = async function (req, res, next) {
    let processor, processorId;
    processorId = req.params.processor_id;
    try {
        processor = await processorManager.getProcessor(processorId);
        return res.status(200).json(processor);
    } catch (err) {
        return next(err);
    }
};
