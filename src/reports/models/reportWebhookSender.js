'use strict';

let request = require('request-promise-native');

let logger = require('../../common/logger');

module.exports.send = async (webhooks, message) => {
    if (!webhooks) {
        return;
    }
    let options = {
        body:
            {
                'text': message,
                'icon_emoji': ':muscle:',
                'username': 'reporter'
            },
        json: true
    };
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
