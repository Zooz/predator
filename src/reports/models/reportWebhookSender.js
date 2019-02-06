'use strict';

let request = require('request-promise-native');

let logger = require('../../common/logger');
let reportModel = require('./reportsManager');

module.exports.send = async (testId, reportId, message, webhooks) => {
    let options = {
        body:
            {
                'text': message,
                'icon_emoji': ':muscle:',
                'username': 'reporter'
            },
        json: true
    };

    if (!webhooks) {
        let report;
        try {
            report = await reportModel.getReport(testId, reportId);
        } catch (error) {
            let errorMessage = `Failed to retrieve summary for testId: ${testId}, reportId: ${reportId}`;
            logger.error(error, errorMessage);
            return Promise.reject(new Error(errorMessage));
        }

        webhooks = report.webhooks;
    }

    let promises = [];
    webhooks.forEach(webhookUrl => {
        promises.push(request.post(Object.assign({ url: webhookUrl }, options)));
    });

    try {
        await Promise.all(promises);
    } catch (error) {
        logger.error(error, 'Failed to send webhooks');
    }
};
