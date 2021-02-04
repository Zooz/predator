'use strict';

const database = require('../../database/database');

async function check(req, res) {
    const errors = {};
    try {
        await database.ping();
        res.code(200).send({ status: 'OK' });
    } catch (error) {
        errors.database = error && error.message ? error.message : error;
        if (Object.keys(errors).length > 0) {
            res.code(503).send({ status: 'DOWN', errors: errors });
        }
    }
}

module.exports = {
    check
};
