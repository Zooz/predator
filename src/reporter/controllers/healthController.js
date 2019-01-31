'use strict';

let databaseConnector = require('../models/databaseConnector');

module.exports.check = function (req, res, next) {
    let errors = {};
    databaseConnector.ping()
        .catch((error) => {
            errors['database'] = error;
        }).then(() => {
            if (Object.keys(errors).length > 0) {
                return res.status(503).json({status: 'DOWN', errors: errors});
            } else {
                return res.json({status: 'OK'});
            }
        });
};
