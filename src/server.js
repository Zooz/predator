const app = require('./app'),
    logger = require('./common/logger'),
    shutdown = require('graceful-shutdown-express');

app().then(app => {
    const serverPort = process.env.PORT || '80';
    const server = app.listen(serverPort, function () {
        logger.info('Predator listening on port ' + serverPort);
    });
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
