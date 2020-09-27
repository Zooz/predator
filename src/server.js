const app = require('./app'),
    logger = require('./common/logger'),
    request = require('request-promise-native'),
    configHandler = require('./configManager/models/configHandler'),
    constConfig = require('./common/consts').CONFIG,
    shutdown = require('graceful-shutdown-express');

app().then(async (app) => {
    const serverPort = process.env.PORT || '80';
    const server = app.listen(serverPort, function () {
        logger.info('Predator listening on port ' + serverPort);
    });

    await verifyInternalAddressReachable();

    shutdown.registerShutdownEvent({
        server: server,
        newConnectionsTimeout: process.env.LOAD_BALANCER_UPDATE_PERIOD || 7000,
        shutdownTimeout: process.env.SHUTDOWN_GRACE_TIMEOUT || 10000,
        logger: logger,
        events: ['SIGTERM', 'SIGINT']
    });
}).catch(error => {
    logger.error(error, 'Encountered an error during start up');
    process.exit(1);
});

async function verifyInternalAddressReachable() {
    if (process.env.SKIP_INTERNAL_ADDRESS_CHECK === 'true') {
        logger.info('Skipping verify internal address check');
        return;
    }

    const internalConfigAddress = await configHandler.getConfigValue(constConfig.INTERNAL_ADDRESS) + '/config';
    logger.info(`Checking ${internalConfigAddress} to verify predator-runners will be able connect to Predator`);
    if (internalConfigAddress.includes('localhost') || internalConfigAddress.includes('127.0.0.1')) {
        logger.warn('INTERNAL_ADDRESS set to localhost, Predator runners may not be able connect Predator if running inside docker bridge mode or in different networks');
    }

    const response = await request.get(internalConfigAddress, { json: true, simple: false, resolveWithFullResponse: true, timeout: 5000 });

    if (response.statusCode !== 200 || !response.body.internal_address) {
        throw new Error(`Failed to reach successfully INTERNAL_ADDRESS, aborting (to skip this check set SKIP_INTERNAL_ADDRESS_CHECK=true\nError: ${response.body}`);
    } else {
        logger.info(`${internalConfigAddress} successfully reached`);
    }
}
