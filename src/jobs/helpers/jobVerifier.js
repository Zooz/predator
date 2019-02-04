'use strict';
let testsManager = require('../../tests/models/manager');
module.exports.verifyJobBody = (req, res, next) => {
    let jobBody = req.body;
    if (!(jobBody.run_immediately || jobBody.cron_expression)) {
        return res.status(400).json({ message: 'Please provide run_immediately or cron_expression in order to schedule a job' });
    }

    next();
};

module.exports.verifyTestExists = async (req, res, next) => {
    let jobBody = req.body;
    if (jobBody.test_id) {
        try {
            await testsManager.getTest(jobBody.test_id);
        } catch (error) {
            if (error.statusCode === 404) {
                return res.status(400).json({ message: `test with id: ${jobBody.test_id} does not exist` });
            } else {
                return res.status(500).json({ message: error.message });
            }
        }
    }
    next();
};