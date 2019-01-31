'use strict';
let request = require('request-promise-native');
let config = require('../../config/serviceConfig');
let uuid = require('uuid/v4');
module.exports.verifyJobBody = (req, res, next) => {
    let jobBody = req.body;
    if (!(jobBody.run_immediately || jobBody.cron_expression)) {
        return res.status(400).json({ message: 'Please provide run_immediately or cron_expression in order to schedule a job' });
    }

    next();
};

// Todo rewrite
module.exports.verifyTestExists = async (req, res, next) => {
    return next();
    // let jobBody = req.body;
    // if (jobBody.test_id) {
    //     try {
    //         await request.get({
    //             url: config.testsApiUrl + '/v1/tests/' + jobBody.test_id,
    //             json: true,
    //             forever: true,
    //             headers: {'x-zooz-request-id': uuid()}
    //         });
    //
    //         if (!req.context) {
    //             req.context = {};
    //         }
    //
    //     } catch (error) {
    //         if (error.statusCode === 404) {
    //             return res.status(400).json({message: `test with id: ${jobBody.test_id} does not exist`});
    //         } else {
    //             return res.status(500).json({message: error.message});
    //         }
    //     }
    // }
    // next();
};