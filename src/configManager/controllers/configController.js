'use strict';
let configModel = require('../model/configHandler');

let logger = require('../../common/logger');

module.exports.getConfig = function (req, res, next) {
    logger.info('inside getConfig()');
    configModel.getConfig().then((response) => {
        return res.status(200).json(response);
    }).catch((err) => {
        return next(err, res);
    });
};

module.exports.updateConfig = function (req, res, next) {
    logger.info('inside updateConfig()');
    let body = req.body;
    configModel.updateConfig(body).then(() => {
        return res.status(200).json(body);
    }).catch((err) => {
        return next(err, res);
    });
};
