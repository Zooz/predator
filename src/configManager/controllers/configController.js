'use strict';
const configModel = require('../models/configHandler');

module.exports.getConfig = async (req, res) => {
    try {
        const response = await configModel.getConfig();
        res.code(200).send(response);
    } catch (err) {
        res.code(500).send(err);
    }
};

module.exports.updateConfig = async (req, res) => {
    const body = req.body;
    try {
        await configModel.updateConfig(body, req.log);
        res.code(200).send(body);
    } catch (err) {
        res.code(500).send(err);
    }
};

module.exports.deleteConfig = async (req, res) => {
    const key = req.params.key;
    try {
        await configModel.deleteConfig(key);
        res.code(204).send();
    } catch (err) {
        res.code(500).send(err);
    }
};
