'use strict';

const database = require('../../database/database');
const streamingManager = require('../../streaming/manager');

module.exports.check = async function (req, res, next) {
    const errors = {};
    try {
        await database.ping();
    } catch (error) {
        errors.database = error && error.message ? error.message : error;
    }
    streamingManager.health();

    if (Object.keys(errors).length > 0) {
        return res
            .status(503)
            .json({ status: 'DOWN', errors });
    } else {
        return res
            .status(200)
            .json({ status: 'OK' });
    }
};