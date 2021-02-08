const logger = require('./logger');
const got = require('got');

const defaultOptions = {
    timeout: 15 * 1000,
    responseType: 'json',
    resolveBodyOnly: true,
    rejectUnauthorized: false
};

module.exports.send = async (options) => {
    Object.assign(options, defaultOptions);
    try {
        const response = await got(options);
        logger.info({ method: options.method, url: options.url, response }, 'Successful request');
        return response;
    } catch (error) {
        logger.error({ method: options.method, url: options.url, error }, 'Error occurred sending request');
        throw error;
    }
};
