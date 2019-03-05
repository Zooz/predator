'use strict';
const configModel = require('../models/configHandler');

module.exports.getConfig = async (req, res, next) => {
    try {
        const response = await configModel.getConfig();
        return res.status(200).json(response);
    } catch (err) {
        return next(err, res);
    }
};

module.exports.updateConfig = async (req, res, next) => {
    const body = req.body;
    try {
        await configModel.updateConfig(body);
        return res.status(200).json(body);
    } catch (err) {
        return next(err, res);
    }
};
