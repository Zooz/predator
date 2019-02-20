const replace = require('replace-in-file');
const config = require('./config/serviceConfig');
const logger = require('./common/logger');

module.exports = () => {
    const options = {
        files: `${__dirname}/../ui/dist/*.js`,
        from: /CHANGE_ME_TO_EXTERNAL_ADDRESS/g,
        to: config.externalAddress
    };

    return replace(options).catch(error => {
        logger.error('Error when changing external address on the predator ui:', error);
        throw error;
    });
};
