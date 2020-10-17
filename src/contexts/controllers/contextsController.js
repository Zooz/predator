'use strict';
const contextManager = require('../models/contextManager');

module.exports = {
    createContext,
    getContexts,
    deleteContext
};

async function getContexts(_, res, next) {
    let contextData;
    try {
        contextData = await contextManager.getContexts();
    } catch (err) {
        return next(err);
    }

    return res.json(contextData);
}

async function createContext(req, res, next) {
    let contextId;
    try {
        contextId = await contextManager.saveContext(req.body.name);
    } catch (err) {
        return next(err);
    }

    return res.status(201).json({ id: contextId, name: req.body.name });
}

async function deleteContext(req, res, next) {
    let deleteResult;
    try {
        deleteResult = await contextManager.deleteContext(req.body.id);
    } catch (err) {
        return next(err);
    }

    if (!deleteResult) {
        res.status(204).json({ message: 'Context not found' });
    }

    return res.status(202).json({ message: 'Context successfully deleted' });
}
