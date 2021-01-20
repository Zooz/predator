'use strict';

const database = require('../../database/database');
const streamingManager = require('../../streaming/manager');

module.exports.check = async function (req, res, next) {
    const errors = await Promise.all([
        database.ping(),
        streamingManager.health()
    ]);
    const filteredErrors = errors.filter((element) => !!element);
    if (filteredErrors.length > 0) {
        return res.status(503).json({ status: 'DOWN', errors: filteredErrors });
    } else {
        return res.json({ status: 'OK' });
    }
};
