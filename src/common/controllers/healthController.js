'use strict';

const database = require('../../database/database');
const streamingManager = require('../../streaming/manager');


async function check(req, res) {
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
        res.code(503).send({ status: 'DOWN', errors });
    } else {
        const returnBody = {
            status: 'OK'
        };
        if (errors.streaming_platform) {
            returnBody.errors = errors;
        }
        res.code(200).send(returnBody);
    }
}

module.exports = {
    check
};
