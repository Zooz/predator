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