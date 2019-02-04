'use strict';

const uuid = require('uuid');

const jobsManager = require('../../../../src/jobs/models/jobManager');

module.exports.createJob = async (emails, webhooks) => {
    let jobOptions = {
        test_id: uuid(),
        arrival_rate: 10,
        duration: 10,
        environment: 'test'
    };

    if (emails) {
        jobOptions.emails = emails;
    }

    if (webhooks) {
        jobOptions.webhooks = webhooks;
    }

    return jobsManager.createJob(jobOptions);
};