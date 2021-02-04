'use strict';
const configModel = require('../models/configHandler');

async function getConfig(req, res) {
    try {
        const response = await configModel.getConfig();
        res.code(200).send(response);
    } catch (err) {
        res.code(500).send(err);
    }
}

async function updateConfig(req, res) {
    const body = req.body;
    try {
        await configModel.updateConfig(body, req.log);
        res.code(200).send(body);
    } catch (err) {
        res.code(500).send(err);
    }
}

async function deleteConfig(req, res) {
    const key = req.params.key;
    try {
        await configModel.deleteConfig(key);
        res.code(204).send();
    } catch (err) {
        res.code(500).send(err);
    }
}

module.exports = {
    getConfig,
    updateConfig,
    deleteConfig
};