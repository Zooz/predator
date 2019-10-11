'use strict';
let processorsModel = require('../models/database/databaseConnector');

module.exports.getAllProcessors = async function (req, res, next) {
    const { query: { from = 0, limit = 100 } } = req;
    let processors;
    try {
        processors = await processorsModel.getAllProcessors(from, limit);
    } catch (err) {
        return next(err);
    }
    return res.status(200).send(processors);
};
