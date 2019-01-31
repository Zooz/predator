'use strict';

let database = require('../../database/database');

module.exports.check = function (req, res, next) {
    let errors = {};
    database.ping()
        .catch((error) => {
            errors['database'] = error && error.message ? error.message : error;
        }).then(() => {
            if (Object.keys(errors).length > 0) {
                return res.status(503).json({ status: 'DOWN', errors: errors });
            } else {
                return res.json({ status: 'OK' });
            }
        });
};
