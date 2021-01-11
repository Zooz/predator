'use strict';

const database = require('../../database/database');

module.exports.check = function (req, res) {
    const errors = {};
    database.ping()
        .catch((error) => {
            errors.database = error && error.message ? error.message : error;
        }).then(() => {
            if (Object.keys(errors).length > 0) {
                return res.code(503).send({ status: 'DOWN', errors: errors });
            } else {
                return res.send({ status: 'OK' });
            }
        });
};
