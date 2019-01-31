'use strict';
require('./env').init();
let express = require('express');
let logger = require('./common/logger');
let healthRouter = require('./common/routes/healthRoute.js');
let jobsRouter = require('./jobs/routes/jobsRoute.js');
let reportsRouter = require('./reporter/routes/reportsRoute.js');
let dslRouter = require('./tests/routes/dslRoute.js');
let testsRouter = require('./tests/routes/testsRoute.js');

let swaggerValidator = require('express-ajv-swagger-validation');
let audit = require('express-requests-logger');
let bodyParser = require('body-parser');
let database = require('./database/database');
let schedulerJobManager = require('./jobs/models/jobManager');

module.exports = () => {
    return swaggerValidator.init('./docs/swagger.yaml', { beautifyErrors: true })
        .then(() => {
            return database.init();
        }).then(() => {
            return schedulerJobManager.reloadCronJobs();
        }).then(() => {
            let app = express();

            app.use(function (req, res, next) {
                res.header('Access-Control-Allow-Origin', '*');
                res.header('Access-Control-Allow-Headers', '*');
                res.header('Access-Control-Allow-Methods', '*');
                next();
            });

            app.use(bodyParser.json());

            app.use(audit({
                logger: logger,
                excludeURLs: ['health']
            }));

            app.use('/health', healthRouter);
            app.use('/', reportsRouter);
            app.use('/', jobsRouter);
            app.use('/v1/dsl', dslRouter);
            app.use('/v1/tests', testsRouter);

            app.use(function (err, req, res, next) {
                if (err instanceof swaggerValidator.InputValidationError) {
                    res.status(400).json({ message: 'Input validation error', validation_errors: err.errors });
                } else {
                    logger.error('Failure', err);
                    res.status(500).json({ message: 'Internal server error' });
                }
            });
            return app;
        });
};