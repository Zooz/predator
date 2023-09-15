'use strict';
const processorManager = require('../models/chaosExperimentsManager');

module.exports.createChaosExperiment = function (req, res, next) {
    return processorManager.createChaosExperiment(req.body)
        .then(function (result) {
            return res.status(201).json(result);
        })
        .catch(function (err) {
            return next(err);
        });
};

module.exports.getAllChaosExperiments = async function (req, res, next) {
    let { query: { from = 0, limit = 100 } } = req;
    let processors;
    try {
        from = parseInt(from);
        limit = parseInt(limit);
        processors = await processorManager.getAllChaosExperiments(from, limit, req.query.exclude);
        return res.status(200).json(processors);
    } catch (err) {
        return next(err);
    }
};

module.exports.getChaosExperimentById = async function (req, res, next) {
    let chaosExperiment;
    const { params: { experiment_id: experimentId } } = req;
    try {
        chaosExperiment = await processorManager.getChaosExperimentById(experimentId);
        return res.status(200).json(chaosExperiment);
    } catch (err) {
        return next(err);
    }
};

module.exports.deleteChaosExperiment = async function (req, res, next) {
    const { params: { experiment_id: experimentId } } = req;
    try {
        await processorManager.deleteChaosExperiment(experimentId);
        return res.status(204).json();
    } catch (err) {
        return next(err);
    }
};
