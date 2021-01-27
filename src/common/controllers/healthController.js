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

    try {
        await streamingManager.health();
    } catch (error) {
        errors.streaming_platform = error && error.message ? error.message : error;
    }

    if (errors.database) {
        return res
            .status(503)
            .json({ status: 'DOWN', errors });
    } else {
        const returnBody = {
            status: 'OK'
        };
        if (errors.streaming_platform) {
            returnBody.errors = errors;
        }
        return res
            .status(200)
            .json(returnBody);
    }
};