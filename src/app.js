'use strict';
require('./env').init();
const express = require('express');
const logger = require('./common/logger');
const healthRouter = require('./common/routes/healthRoute.js');
const jobsRouter = require('./jobs/routes/jobsRoute.js');
const reportsRouter = require('./reports/routes/reportsRoute.js');
const configRouter = require('./configManager/routes/configRoute.js');
const dslRouter = require('./tests/routes/dslRoute.js');
const testsRouter = require('./tests/routes/testsRoute.js');
const processorsRouter = require('./processors/routes/processorsRoute.js');
const filesRouter = require('./files/routes/filesRoute.js');
const webhooksRouter = require('./webhooks/routes/webhooksRouter');
const contextsRouter = require('./contexts/routes/contextsRoute.js');
const swaggerValidator = require('express-ajv-swagger-validation');

const audit = require('express-requests-logger');
const bodyParser = require('body-parser');
const database = require('./database/database');
const jobsManager = require('./jobs/models/jobManager');
const path = require('path');
const zip = require('express-easy-zip');
const fileUpload = require('express-fileupload');
module.exports = async () => {
    swaggerValidator.init('./docs/openapi3.yaml', { beautifyErrors: true });
    await database.init();
    await jobsManager.init();
    await jobsManager.reloadCronJobs();
    await jobsManager.scheduleFinishedContainersCleanup();
    const app = express();

    app.use(fileUpload({
        createParentPath: true,
        limits: {
            fileSize: (process.env.MAX_UPLOAD_FILE_SIZE_MB || 10) * 1024 * 1024
        }
    }));

    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', '*');
        res.header('Access-Control-Allow-Methods', '*');
        next();
    });
    // all root request are suppose to be the ui , so we put the route before the audit to avoid audit.
    app.use('/ui', express.static('./ui/dist'));
    app.use('/ui', function (req, res, next) {
        res.sendFile(path.resolve('ui/dist/index.html'));
    });

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    app.use(audit({
        logger: logger,
        excludeURLs: ['health', 'ui', 'favicon.png', 'files'],
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
    app.use('/v1/processors', processorsRouter);
    app.use('/v1/files', filesRouter);
    app.use('/v1/webhooks', webhooksRouter);
    app.use('/v1/contexts', contextsRouter);

    app.use('/', function (req, res, next) {
        res.redirect('/ui');
    });

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
};
