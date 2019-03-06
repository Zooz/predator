'use strict';

const request = require('request-promise-native'),
    util = require('util'),
    should = require('should'),
    configHandler = require('../../configManager/models/configHandler'),
    configConst = require('../../common/consts').CONFIG,
    smtpServerUrlTemplate = 'http://%s:%s';

module.exports.validateEmail = async () => {
    return new Promise((resolve, reject) => {
        setTimeout(async () => {
            const configSmtp = configHandler.getConfigValue(configConst.SMTP_SERVER);
            const messages = await request({
                method: 'GET',
                url: util.format(smtpServerUrlTemplate, configSmtp.host, configSmtp.port) + '/api/v1/messages',
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

module.exports.clearAllOldMails = async () => {
    const configSmtp = await configHandler.getConfigValue(configConst.SMTP_SERVER);
    return request({
        method: 'DELETE',
        url: util.format(smtpServerUrlTemplate, configSmtp.host, configSmtp.port) + '/api/v1/messages',
        timeout: 2000,
        time: true
    });
};