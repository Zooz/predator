const logger = require('./logger');
const request = require('request-promise-native');

const defaultOptions = {
    timeout: 15 * 1000,
    json: true,
    rejectUnauthorized: false
};

module.exports.send = async (options) => {
    Object.assign(options, defaultOptions);
    try {
        const response = await request(options);
        logger.info({ method: options.method, url: options.url, response }, 'Successful request');
        return response;
    } catch (error) {
        logger.error({ method: options.method, url: options.url, error }, 'Error occurred sending request');
        throw error;
    }
};
