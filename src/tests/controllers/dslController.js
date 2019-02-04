'use strict';

const dsl = require('../models/dsl');
module.exports = {
    createDefinition,
    getDslDefinition,
    getDslDefinitions,
    updateDefinition,
    deleteDefinition
};
async function getDslDefinitions(req, res, next) {
    try {
        const result = await dsl.getDefinitions(req.params.dsl_name);
        return res.status(200).json(result);
    } catch (err){
        return next(err);
    }
}
async function getDslDefinition(req, res, next) {
    try {
        const result = await dsl.getDefinition(req.params.dsl_name, req.params.definition_name);
        return res.status(200).json(result);
    } catch (err){
        return next(err);
    }
}

async function createDefinition(req, res, next) {
    try {
        const result = await dsl.createDefinition(req.params.dsl_name, req.body);
        return res.status(201).json(result);
    } catch (err){
        return next(err);
    }
}
async function updateDefinition(req, res, next) {
    try {
        const result = await dsl.updateDefinition(req.params.dsl_name, req.params.definition_name, req.body);
        return res.status(200).json(result);
    } catch (err){
        return next(err);
    }
}
async function deleteDefinition(req, res, next) {
    try {
        await dsl.deleteDefinition(req.params.dsl_name, req.params.definition_name);
        return res.status(204).send();
    } catch (err){
        return next(err);
    }
}
