'use strict';
require('./env').init();
const fastify = require('fastify');
const path = require('path');
const fileUpload = require('fastify-file-upload')
const { fastifyRequestContextPlugin } = require('fastify-request-context');
const swaggerValidator = require('openapi-validator-middleware');
const database = require('./database/database');
const jobsManager = require('./jobs/models/jobManager');
const validators = require('./configManager/helpers/validators');
const filesController = require('./files/controllers/filesController');
const jobVerifier = require('./jobs/helpers/jobVerifier');
const jobs = require('./jobs/controllers/jobsController');
const reports = require('./reports/controllers/reportsController');
const webhooksController = require('./webhooks/controllers/webhooksController');
const processors = require('./processors/controllers/processorController');
const tests = require('./tests/controllers/testsController');
const testsVerifier = require('./tests/helpers/testsVerifier');
const artilleryValidator = require('./tests/helpers/artilleryValidator');
const dsl = require('./tests/controllers/dslController');
const {verifyReportIDInRoute} = require('./reports/utils/middlewares');
const customValidation = require('./tests/middlewares/customValidation');

const {CONTEXT_ID} = require('./common/consts');
const health = require('./common/controllers/healthController');
const logger = require('./common/logger');

module.exports = async () => {
    swaggerValidator.init('./docs/openapi3.yaml', { framework: 'fastify', beautifyErrors: true });
    await database.init();
    await jobsManager.init();
    await jobsManager.reloadCronJobs();
    await jobsManager.scheduleFinishedContainersCleanup();

    const app = fastify({
        logger,
        bodyLimit: process.env.BODY_PARSER_LIMIT || '524288'
    });

    //plugins
    app.register(fileUpload, {
        createParentPath: true,
        limits: { 
            fileSize: (process.env.MAX_UPLOAD_FILE_SIZE_MB || 10) * 1024 * 1024
        },
    });
    app.register(
        require('fastify-compress'),
        { global: false }
    );
    app.register(require('fastify-static'), {
        root: path.join(__dirname, 'ui/dist'),
        prefix: '/ui/dist/'
    });
    app.register(require('fastify-formbody'));
    app.register(fastifyRequestContextPlugin);
    app.register(require('fastify-graceful-shutdown'), { timeout: process.env.SHUTDOWN_GRACE_TIMEOUT || 10000 })
    app.register(swaggerValidator.validate({
        skiplist: ['^/health$', '^/v1/jobs/runs/containers$', '^/v1/files$', '^/ui$']
    }));
    app.setErrorHandler((err, req, reply) => {
        if (err instanceof swaggerValidator.InputValidationError) {
            return reply.code(400).send({ message: 'Input validation error', validation_errors: err.errors });
        } else if (err.statusCode) {
            return reply.code(err.statusCode).send({ message: err.message });
        } else {
            logger.error(err, 'Failure');
            reply.code(500).send({ message: 'Internal server error' });
        }
        reply.code(500).send();
    });
    //hooks
    app.addHook('onRequest', (req, reply, done) => {
        const contextId = req.get('x-context-id') || undefined;
        req.requestContext.set(CONTEXT_ID, contextId);
        reply.headers({
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Allow-Methods': '*'
        })
        done()
    });

    //TODO: what for? Safe to disable?
    // app.set('json replacer', (k, v) => (v === null ? undefined : v))

    //root route
    app.get('/', function (req, reply) {
        reply.redirect(303, '/ui')
    });
    app.get('/ui', { logLevel: 'error' }, function (req, reply) {
        reply.sendFile('index.html');
    });
    //health check
    app.get('/health', { logLevel: 'error' }, health.check);
    //config
    app.put('/v1/config', {
        preHandler: async (req, reply) => {
            try {
                await validators.validateBenchmarkWeights(req, reply);
            } catch (err) {
                reply.send(err);
            }
        }
    }, config.updateConfig);
    app.delete('/v1/config/:key', config.deleteConfig);
    app.get('/v1/config', config.getConfig);
    //jobs
    app.post('/v1/jobs', {
        preHandler: async (req, reply) => {
            try {
                await jobVerifier.verifyJobBody(req, reply);
                await jobVerifier.verifyTestExists(req, reply);
            } catch (err) {
                reply.send(err);
            }
        }
    }, jobs.createJob);
    app.get('/v1/jobs', jobs.getJobs);
    app.get('/v1/jobs/:job_id', jobs.getJob);
    app.put('/v1/jobs/:job_id', {
        preHandler: async (req, reply) => {
            try {
                await jobVerifier.verifyTestExists(req, reply)
            } catch (err) {
                reply.send(err);
            }
        }
    }, jobs.updateJob);
    app.delete('/v1/jobs/:job_id', jobs.deleteJob);
    app.post('/v1/jobs/:job_id/runs/:report_id/stop', jobs.stopRun);
    app.get('/v1/jobs/:job_id/runs/:report_id/logs', jobs.getLogs);
    app.delete('/v1/jobs/runs/containers', jobs.deleteAllContainers);
    //dsl
    app.post('/v1/dsl/:dsl_name/definitions',  {
        preHandler: async (req, reply) => {
            try {
                await customValidation.createDslValidator(req, reply)
            } catch (err) {
                reply.send(err);
            }
        }
    }, dsl.createDefinition);
    app.get('/v1/dsl/:dsl_name/definitions', dsl.getDslDefinitions);
    app.get('/v1/dsl/:dsl_name/definitions/:definition_name', dsl.getDslDefinition);
    app.put('/v1/dsl/:dsl_name/definitions/:definition_name', {
        preHandler: async (req, reply) => {
            try {
                await customValidation.createDslValidator(req, reply)
            } catch (err) {
                reply.send(err);
            }
        }
    }, dsl.updateDefinition);
    app.delete('/v1/dsl/:dsl_name/definitions/:definition_name', dsl.deleteDefinition);
    //reports
    app.get('/v1/tests/:test_id/reports/:report_id/aggregate', reports.getAggregateReport);
    app.get('/v1/tests/:test_id/reports/:report_id', reports.getReport);
    app.put('/v1/tests/:test_id/reports/:report_id', {
        onRequest: async (req, reply) => {
            try {
                await verifyReportIDInRoute(req, reply);
            } catch (err) {
                reply.send(err);
            }
        }
    }, reports.editReport);
    app.delete('/v1/tests/:test_id/reports/:report_id', {
        onRequest: async (req, reply) => {
            try {
                await verifyReportIDInRoute(req, reply);
            } catch (err) {
                reply.send(err);
            }
        }
    }, reports.deleteReport);
    app.get('/v1/tests/:test_id/reports/', reports.getReports);
    app.post('/v1/tests/:test_id/reports/', reports.postReport);
    app.get('/v1/tests/last_reports/', reports.getLastReports);
    app.post('/v1/tests/:test_id/reports/:report_id/subscribe', reports.subscribeRunnerToReport);
    app.post('/v1/tests/:test_id/reports/:report_id/stats', reports.postStats);
    app.get('/v1/tests/:test_id/reports/:report_id/export/:file_format', reports.getExportedReport);
    app.get('/v1/tests/reports/compare/export/:file_format', reports.getExportedCompareReport);
    //tests
    app.post('/v1/tests', {
        preHandler: async (req, reply) => {
            try {
                await testsVerifier.verifyProcessorIsValid(req, reply);
                await artilleryValidator.verifyArtillery(req, reply);
            } catch (err) {
                reply.send(err);
            }
        }
    }, tests.upsertTest);
    app.get('/v1/tests', tests.getTests);
    app.get('/v1/tests/:test_id', tests.getTest);
    app.delete('/v1/tests/:test_id', tests.deleteTest);
    app.put('/v1/tests/:test_id', {
        preHandler: async (req, reply) => {
            try {
                await testsVerifier.verifyProcessorIsValid(req, reply);
                await artilleryValidator.verifyArtillery(req, reply);
            } catch (err) {
                reply.send(err);
            }
        }
    }, tests.upsertTest);
    app.post('/v1/tests/:test_id/benchmark', {
        preHandler: async (req, reply) => {
            try {
                await testsVerifier.verifyTestExist(req, reply);
            } catch (err) {
                reply.send(err);
            }
        }
    }, tests.insertTestBenchmark);
    app.get('/v1/tests/:test_id/benchmark', {
        preHandler: async (req, reply) => {
            try {
                await testsVerifier.verifyTestExist(req, reply);
            } catch (err) {
                reply.send(err);
            }
        }
    }, tests.getBenchmark);
    app.get('/v1/tests/:test_id/revisions', tests.getTestRevisions);
    //processors
    app.get('/v1/processors', processors.getAllProcessors);
    app.post('/v1/processors', processors.createProcessor);
    app.get('/v1/processors/:processor_id', processors.getProcessor);
    app.delete('/v1/processors/:processor_id', processors.deleteProcessor);
    app.put('/v1/processors/:processor_id', processors.updateProcessor);
    //files
    app.post('/v1/files', filesController.saveFile);
    app.get('/v1/files/:file_id', filesController.getFile);
    app.get('/v1/files/:file_id/metadata', filesController.getFileMetadata);
    //webhooks
    app.get('/v1/webhooks', webhooksController.getAllWebhooks);
    app.post('/v1/webhooks', webhooksController.createWebhook);
    app.get('/v1/webhooks/:webhook_id', webhooksController.getWebhook);
    app.post('/v1/webhooks/test', webhooksController.testWebhook);
    app.delete('/v1/webhooks/:webhook_id', webhooksController.deleteWebhook);
    app.put('/v1/webhooks/:webhook_id', webhooksController.updateWebhook);

    return app;
};
