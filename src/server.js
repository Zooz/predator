const appServer = require('./app'),
    configHandler = require('./configManager/models/configHandler'),
    constConfig = require('./common/consts');
const logger = require('./common/logger');
const got = require('got');


appServer().then(async (app) => {
    const serverPort = process.env.PORT || '80';
    try {
        await app.listen(serverPort);
        logger.info('Predator listening on port ' + serverPort);
    } catch (error) {
        logger.error(error, 'Encountered an error during start up');
        process.exit(1)
    }
    await verifyInternalAddressReachable(app);
}).catch(error => {
    process.exit(1);
});

async function verifyInternalAddressReachable() {
    if (process.env.SKIP_INTERNAL_ADDRESS_CHECK === 'true') {
        logger.info('Skipping verify internal address check');
        return;
    }

    const internalConfigAddress = await configHandler.getConfigValue(constConfig.CONFIG.INTERNAL_ADDRESS) + '/config';
    logger.info(`Checking ${internalConfigAddress} to verify predator-runners will be able connect to Predator`);
    if (internalConfigAddress.includes('localhost') || internalConfigAddress.includes('127.0.0.1')) {
        logger.warn('INTERNAL_ADDRESS set to localhost, Predator runners may not be able connect Predator if running inside docker bridge mode or in different networks');
    }

    try {
        await got(internalConfigAddress, {
            responseType: 'json',
            resolveBodyOnly: false,
            timeout: 5000
        });
        logger.info(`${internalConfigAddress} successfully reached`);
    } catch (error) {
        console.log(error);
        let platform = await configHandler.getConfigValue(constConfig.CONFIG.JOB_PLATFORM);
        if (platform === constConfig.DOCKER) {
            throw new Error(`Failed to reach successfully INTERNAL_ADDRESS at ${internalConfigAddress}, shutting down server (to skip this check set SKIP_INTERNAL_ADDRESS_CHECK=true\nError: ${error.message}`);
        } else {
            logger.warn(`Failed to reach successfully INTERNAL_ADDRESS at ${internalConfigAddress}`);
        }
    }
}
