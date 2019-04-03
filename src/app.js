'use strict';
require('./env').init();
let express = require('express');
let logger = require('./common/logger');
let healthRouter = require('./common/routes/healthRoute.js');
let jobsRouter = require('./jobs/routes/jobsRoute.js');
let reportsRouter = require('./reports/routes/reportsRoute.js');
let configRouter = require('./configManager/routes/configRoute.js');
let dslRouter = require('./tests/routes/dslRoute.js');
let testsRouter = require('./tests/routes/testsRoute.js');

let swaggerValidator = require('express-ajv-swagger-validation');
let audit = require('express-requests-logger');
let bodyParser = require('body-parser');
let database = require('./database/database');
let schedulerJobManager = require('./jobs/models/jobManager');
let path = require('path');
let zip = require('express-easy-zip');

module.exports = () => {
    return swaggerValidator.init('./docs/openapi3.yaml', { beautifyErrors: true })
        .then(() => {
            return database.init();
        }).then(() => {
            return schedulerJobManager.reloadCronJobs();
        })
        .then(() => {
            let app = express();

            app.use(function (req, res, next) {
                res.header('Access-Control-Allow-Origin', '*');
                res.header('Access-Control-Allow-Headers', '*');
                res.header('Access-Control-Allow-Methods', '*');
                next();
            });
            // all root request are suppose to be the ui , so we put the route before the audit to avoid audit.
            app.use('/predator',express.static('./ui/dist'));
            app.use('/predator', function (req, res, next) {
                res.sendFile(path.resolve('ui/dist/index.html'));
            });

            app.use(bodyParser.json());

            app.use(audit({
                logger: logger,
                excludeURLs: ['health', 'predator', 'favicon.png'],
                response: {
                    excludeBody: ['*']
                }
            }));

            app.use(zip());
            app.use('/health', healthRouter);
            app.use('/v1/config', configRouter);
            app.use('/v1/jobs', jobsRouter);
            app.use('/v1/dsl', dslRouter);
            app.use('/v1/tests', reportsRouter);
            app.use('/v1/tests', testsRouter);
            app.use(function (err, req, res, next) {
                if (err instanceof swaggerValidator.InputValidationError) {
                    res.status(400).json({ message: 'Input validation error', validation_errors: err.errors });
                } else if (err.statusCode){
                    return res.status(err.statusCode).json({ message: err.message });
                } else {
                    logger.error(err, 'Failure');
                    res.status(500).json({ message: 'Internal server error' });
                }
            });

            return app;
        });
};