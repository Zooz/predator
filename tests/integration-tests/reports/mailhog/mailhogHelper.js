'use strict';

const request = require('request-promise-native'),
    util = require('util'),
    should = require('should'),
    configHandler = require('../../configManager/models/configHandler'),
    cnfigConsts = require('../../common/consts').CONFIG,
    configSmtp = configHandler.getConfigValue(cnfigConsts.SMTP_SERVER),
    smtpServerUrl = util.format('http://%s:%s', configSmtp.host, configSmtp.port);

module.exports.validateEmail = async () => {
    return new Promise((resolve, reject) => {
        setTimeout(async () => {
            const messages = await request({
                method: 'GET',
                url: smtpServerUrl + '/api/v1/messages',
                timeout: 2000,
                time: true
            });

            if (messages === '[]') {
                reject(new Error('The SMTP server did not get the email...'));
            } else {
                should(JSON.parse(messages).length).eql(1);
                const email = JSON.parse(messages)[0];
                console.log(email);
                resolve(email);
            }
        }, 1000);
    });
};

module.exports.clearAllOldMails = () => {
    return request({
        method: 'DELETE',
        url: smtpServerUrl + '/api/v1/messages',
        timeout: 2000,
        time: true
    });
};