'use strict';

const dsl = require('../models/dsl');

async function getDslDefinitions(req, res) {
    try {
        const result = await dsl.getDefinitions(req.params.dsl_name, req.requestContext);
        res.code(200).send(result);
    } catch (err){
        res.send(err);
    }
}
async function getDslDefinition(req, res) {
    try {
        const result = await dsl.getDefinition(req.params.dsl_name, req.params.definition_name, req.requestContext);
        res.code(200).send(result);
    } catch (err){
        res.send(err);
    }
}

async function createDefinition(req, res) {
    try {
        const result = await dsl.createDefinition(req.params.dsl_name, req.body, req.requestContext);
        res.code(201).send(result);
    } catch (err){
        res.send(err);
    }
}
async function updateDefinition(req, res) {
    try {
        const result = await dsl.updateDefinition(req.params.dsl_name, req.params.definition_name, req.body, req.requestContext);
        res.code(200).send(result);
    } catch (err){
        res.send(err);
    }
}
async function deleteDefinition(req, res) {
    try {
        await dsl.deleteDefinition(req.params.dsl_name, req.params.definition_name, req.requestContext);
        res.code(204).send();
    } catch (err){
        res.send(err);
    }
}

module.exports = {
    createDefinition,
    getDslDefinition,
    getDslDefinitions,
    updateDefinition,
    deleteDefinition
};