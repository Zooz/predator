'use strict';
process.env.JOB_PLATFORM = 'DOCKER';
const sinon = require('sinon');
// eslint-disable-next-line no-unused-vars
const should = require('should');

const logger = require('../../../../src/common/logger');
const notifier = require('../../../../src/reports/models/notifier');
const jobsManager = require('../../../../src/jobs/models/jobManager');
const webhooksManager = require('../../../../src/webhooks/models/webhookManager');
const configHandler = require('../../../../src/configManager/models/configHandler');
const statsFormatter = require('../../../../src/webhooks/models/statsFormatter');
const aggregateReportGenerator = require('../../../../src/reports/models/aggregateReportGenerator');
const reportEmailSender = require('../../../../src/reports/models/reportEmailSender');
const reportsManager = require('../../../../src/reports/models/reportsManager');
const {
    WEBHOOK_EVENT_TYPE_FAILED,
    WEBHOOK_EVENT_TYPE_STARTED,
    WEBHOOK_EVENT_TYPE_IN_PROGRESS,
    WEBHOOK_EVENT_TYPE_FINISHED,
    WEBHOOK_EVENT_TYPE_BENCHMARK_PASSED,
    WEBHOOK_EVENT_TYPE_BENCHMARK_FAILED,
    WEBHOOK_EVENT_TYPE_ABORTED,
    WEBHOOK_EVENT_TYPE_API_FAILURE
} = require('../../../../src/common/consts');
const { SUBSCRIBER_INTERMEDIATE_STAGE, SUBSCRIBER_FAILED_STAGE, SUBSCRIBER_STARTED_STAGE, SUBSCRIBER_FIRST_INTERMEDIATE_STAGE, SUBSCRIBER_DONE_STAGE, SUBSCRIBER_ABORTED_STAGE } = require('../../../../src/reports/utils/constants');

describe('Webhook/email notifier test ', () => {
    let sandbox, loggerInfoStub, webhooksManagerFireWebhookStub,
        statsFormatterStub, jobsManagerStub, getConfigStub, aggregateReportGeneratorStub, reportEmailSenderStub,
        getReportsStub;
    before(() => {
        sandbox = sinon.sandbox.create();
        loggerInfoStub = sandbox.stub(logger, 'info');
        sandbox.stub(logger, 'warn');
        webhooksManagerFireWebhookStub = sandbox.stub(webhooksManager, 'fireWebhookByEvent');
        statsFormatterStub = sandbox.stub(statsFormatter, 'getStatsFormatted');
        jobsManagerStub = sandbox.stub(jobsManager, 'getJob');
        getConfigStub = sandbox.stub(configHandler, 'getConfigValue');
        aggregateReportGeneratorStub = sandbox.stub(aggregateReportGenerator, 'createAggregateReport');
        reportEmailSenderStub = sandbox.stub(reportEmailSender, 'sendAggregateReport');
        getReportsStub = sandbox.stub(reportsManager, 'getReports');
    });

    beforeEach(() => {
        sandbox.resetHistory();
    });

    after(() => {
        sandbox.restore();
    });

    it('handling message with phase: error', async () => {
        const job = {
            some: 'value',
            more: 'keys'
        };
        jobsManagerStub.resolves(job);
        const report = { environment: 'test', report_id: 'report_id', test_id: 'test_id' };
        const stats = {
            phase_status: SUBSCRIBER_FAILED_STAGE,
            error: {
                code: 500,
                message: 'fail to get test'
            },
            data: JSON.stringify({ message: 'fail to get test' })
        };
        await notifier.notifyIfNeeded(report, stats);

        webhooksManagerFireWebhookStub.callCount.should.equal(1);
        webhooksManagerFireWebhookStub.args[0].should.containDeep([job, WEBHOOK_EVENT_TYPE_FAILED, report]);
        loggerInfoStub.callCount.should.equal(1);
        loggerInfoStub.args.should.deepEqual([
            [
                {
                    testId: 'test_id',
                    reportId: 'report_id'
                },
                {
                    code: 500,
                    message: 'fail to get test'
                },
                'handling error message'
            ]
        ]);
    });

    describe('handling message with phase: started_phase', () => {
        it('parallelism is 2 and ramp to is defined, runners in correct phases ', async () => {
            const job = {
                some: 'keys'
            };
            jobsManagerStub.resolves(job);
            const report = {
                environment: 'test',
                report_id: 'report_id',
                test_id: 'test_id',
                test_name: 'some_test_name',
                duration: 10,
                arrival_rate: 10,
                parallelism: 2,
                ramp_to: 20,
                status: 'started',
                phase: '0',
                subscribers: [{ phase_status: SUBSCRIBER_STARTED_STAGE }, { phase_status: SUBSCRIBER_STARTED_STAGE }]

            };
            const stats = {
                phase_status: SUBSCRIBER_STARTED_STAGE,
                data: JSON.stringify({ message: 'fail to get test' })
            };
            await notifier.notifyIfNeeded(report, stats);

            webhooksManagerFireWebhookStub.callCount.should.equal(1);
            webhooksManagerFireWebhookStub.args[0].should.containDeep([job, WEBHOOK_EVENT_TYPE_STARTED, report]);
            loggerInfoStub.callCount.should.equal(1);
        });

        it('parallelism is not defined, runner in corrects phase ', async () => {
            const job = {
                some: 'keys'
            };
            jobsManagerStub.resolves(job);
            const report = {
                environment: 'test',
                report_id: 'report_id',
                test_id: 'test_id',
                test_name: 'some_test_name',
                duration: 10,
                arrival_rate: 10,
                subscribers: [{ phase_status: SUBSCRIBER_STARTED_STAGE }]
            };
            const stats = {
                phase_status: SUBSCRIBER_STARTED_STAGE,
                data: JSON.stringify({ message: 'fail to get test' })
            };
            await notifier.notifyIfNeeded(report, stats);

            webhooksManagerFireWebhookStub.callCount.should.equal(1);
            webhooksManagerFireWebhookStub.args[0].should.containDeep([job, WEBHOOK_EVENT_TYPE_STARTED, report]);
            loggerInfoStub.callCount.should.equal(1);
        });
    });

    it('parallelism is 2, runners in different phases', async () => {
        jobsManagerStub.resolves({
            webhooks: ['http://www.zooz.com', 'http://www.zooz2.com']
        });
        const report = {
            environment: 'test',
            report_id: 'report_id',
            test_id: 'test_id',
            test_name: 'some_test_name',
            duration: 10,
            arrival_rate: 10,
            parallelism: 2,
            ramp_to: 20,
            status: 'started',
            phase: '0',
            subscribers: [{ phase_status: SUBSCRIBER_STARTED_STAGE }, { phase_status: 'not_started_phase' }]

        };
        const stats = {
            phase_status: SUBSCRIBER_STARTED_STAGE
        };
        await notifier.notifyIfNeeded(report, stats);

        webhooksManagerFireWebhookStub.callCount.should.equal(0);
    });

    it('handling message with phase: first_intermediate', async () => {
        const job = {
            some: 'keys'
        };
        const aggregatedReport = {};
        aggregateReportGeneratorStub.resolves(aggregatedReport);

        jobsManagerStub.resolves(job);
        const report = {
            environment: 'test',
            report_id: 'report_id',
            test_id: 'test_id',
            test_name: 'some_test_name',
            duration: 10,
            arrival_rate: 10,
            parallelism: 2,
            ramp_to: 20,
            status: 'started',
            phase: 0,
            subscribers: [{ phase_status: SUBSCRIBER_FIRST_INTERMEDIATE_STAGE }, { phase_status: SUBSCRIBER_FIRST_INTERMEDIATE_STAGE }]

        };
        const stats = {
            phase_status: SUBSCRIBER_FIRST_INTERMEDIATE_STAGE,
            data: JSON.stringify({})
        };

        statsFormatterStub.returns('max: 1, min: 0.4, median: 0.7');

        await notifier.notifyIfNeeded(report, stats);

        webhooksManagerFireWebhookStub.callCount.should.equal(1);
        webhooksManagerFireWebhookStub.args[0].should.containDeep([job, WEBHOOK_EVENT_TYPE_IN_PROGRESS, report]);
        loggerInfoStub.callCount.should.equal(1);
    });

    it('handling message with phase: intermediate, not first message', async () => {
        const job = {
            some: 'keys'
        };
        jobsManagerStub.resolves(job);
        const report = {
            environment: 'test',
            report_id: 'report_id',
            test_id: 'test_id',
            test_name: 'some_test_name',
            duration: 10,
            arrival_rate: 10,
            parallelism: 5,
            ramp_to: 20,
            status: 'running',
            phase: 0,
            subscribers: [{ phase_status: SUBSCRIBER_INTERMEDIATE_STAGE, last_stats: { codes: { 200: 15, 301: 13 } } }, { phase_status: SUBSCRIBER_INTERMEDIATE_STAGE, last_stats: { codes: { 200: 15, 301: 13 } } }]
        };
        statsFormatterStub.returns('max: 1, min: 0.4, median: 0.7');
        const stats = {
            phase_status: SUBSCRIBER_INTERMEDIATE_STAGE,
            data: JSON.stringify({})
        };

        await notifier.notifyIfNeeded(report, stats);

        webhooksManagerFireWebhookStub.callCount.should.equal(0);
    });

    it('Handling message with phase: intermediate, having status codes with >= 500, should fire API_FAILURE webhooks flow', async function() {
        const job = {
            some: 'keys'
        };
        jobsManagerStub.resolves(job);
        const report = {
            environment: 'test',
            report_id: 'report_id',
            test_id: 'test_id',
            test_name: 'some_test_name',
            duration: 10,
            arrival_rate: 10,
            parallelism: 5,
            ramp_to: 20,
            status: 'running',
            phase: 0,
            subscribers: [{ phase_status: SUBSCRIBER_INTERMEDIATE_STAGE, last_stats: { codes: { 200: 15, 301: 13, 500: 1 } } }, { phase_status: SUBSCRIBER_INTERMEDIATE_STAGE, last_stats: { codes: { 200: 15, 301: 13 } } }]
        };
        const accumulatedStatusCodesCounter = { 200: 30, 301: 26, 500: 1 };
        statsFormatterStub.returns('max: 1, min: 0.4, median: 0.7');
        const stats = {
            phase_status: SUBSCRIBER_INTERMEDIATE_STAGE,
            data: JSON.stringify({})
        };

        await notifier.notifyIfNeeded(report, stats);

        webhooksManagerFireWebhookStub.callCount.should.equal(1);
        webhooksManagerFireWebhookStub.args[0].should.containDeep([job, WEBHOOK_EVENT_TYPE_API_FAILURE, report, { accumulatedStatusCodesCounter }, { icon: ':skull:' }]);
    });

    describe('Handling messages with phase: done', function() {
        it('should fire FINISHED webhook flow for unset benchmark threshold', async function() {
            const job = {
                some: 'keys',
                emails: []
            };
            const score = 100;
            const aggregatedReport = {
                special: 'key'
            };
            const report = {
                environment: 'test',
                report_id: 'report_id',
                test_id: 'test_id',
                test_name: 'some_test_name',
                duration: 10,
                arrival_rate: 10,
                parallelism: 2,
                ramp_to: 20,
                status: 'started',
                phase: 0,
                subscribers: [{ phase_status: SUBSCRIBER_DONE_STAGE }, { phase_status: SUBSCRIBER_DONE_STAGE }]

            };
            const stats = {
                phase_status: SUBSCRIBER_DONE_STAGE,
                data: JSON.stringify({})
            };

            getConfigStub.resolves(undefined);
            getConfigStub.withArgs(sinon.match('benchmark_threshold')).resolves(undefined);
            aggregateReportGeneratorStub.resolves(aggregatedReport);
            jobsManagerStub.resolves(job);

            await notifier.notifyIfNeeded(report, stats, { score });

            webhooksManagerFireWebhookStub.callCount.should.equal(1);
            webhooksManagerFireWebhookStub.args[0].should.containDeep([job, WEBHOOK_EVENT_TYPE_FINISHED, report, { score }, { icon: ':rocket:' }]);

            reportEmailSenderStub.callCount.should.equal(0);
        });
        it('should fire 2 webhooks flows, 1 with BENCHMARK_PASSED and FINISHED, should also take 3 last scores', async function() {
            const job = {
                some: 'keys',
                emails: ['meow@catdomain.com']
            };
            const score = 97;
            const aggregatedReport = {
                special: 'key'
            };
            const report = {
                environment: 'test',
                report_id: 'report_id',
                test_id: 'test_id',
                test_name: 'some_test_name',
                duration: 10,
                arrival_rate: 10,
                parallelism: 2,
                ramp_to: 20,
                status: 'started',
                phase: 0,
                subscribers: [{ phase_status: SUBSCRIBER_DONE_STAGE }, { phase_status: SUBSCRIBER_DONE_STAGE }]

            };
            const stats = {
                phase_status: SUBSCRIBER_DONE_STAGE,
                data: JSON.stringify({})
            };
            const reports = [{ score: 90 }, { score: 95 }, { score: 95.444 }, { score: 100 }];
            const benchmarkThreshold = 30;
            const reportBenchmark = { score };

            getConfigStub.resolves(undefined);
            getConfigStub.withArgs(sinon.match('benchmark_threshold')).resolves(benchmarkThreshold);
            aggregateReportGeneratorStub.resolves(aggregatedReport);
            jobsManagerStub.resolves(job);
            getReportsStub.resolves(reports);

            await notifier.notifyIfNeeded(report, stats, reportBenchmark);

            webhooksManagerFireWebhookStub.callCount.should.equal(2);
            webhooksManagerFireWebhookStub.args[0].should.containDeep([job, WEBHOOK_EVENT_TYPE_BENCHMARK_PASSED, report, { score, lastScores: ['90.0', '95.0', '95.4'], benchmarkThreshold }, { icon: ':grin:' }]);
            webhooksManagerFireWebhookStub.args[1].should.containDeep([job, WEBHOOK_EVENT_TYPE_FINISHED, report, { score }, { icon: ':rocket:' }]);

            reportEmailSenderStub.callCount.should.equal(1);
            reportEmailSenderStub.args[0].should.containDeep([aggregatedReport, job, job.emails, reportBenchmark]);
        });
        it('should fire 2 webhooks flows, 1 with BENCHMARK_FAILED and FINISHED', async function() {
            const job = {
                some: 'keys',
                emails: ['meow@catdomain.com']
            };
            const score = 20;
            const aggregatedReport = {
                special: 'key'
            };
            const report = {
                environment: 'test',
                report_id: 'report_id',
                test_id: 'test_id',
                test_name: 'some_test_name',
                duration: 10,
                arrival_rate: 10,
                parallelism: 2,
                ramp_to: 20,
                status: 'started',
                phase: 0,
                subscribers: [{ phase_status: SUBSCRIBER_DONE_STAGE }, { phase_status: SUBSCRIBER_DONE_STAGE }]

            };
            const stats = {
                phase_status: SUBSCRIBER_DONE_STAGE,
                data: JSON.stringify({})
            };
            const reports = [{ score: 20 }, { score: 20 }, { score: 20.6 }, { score: 20 }];
            const benchmarkThreshold = 30;
            const reportBenchmark = { score };

            getConfigStub.resolves(undefined);
            getConfigStub.withArgs(sinon.match('benchmark_threshold')).resolves(benchmarkThreshold);
            aggregateReportGeneratorStub.resolves(aggregatedReport);
            jobsManagerStub.resolves(job);
            getReportsStub.resolves(reports);

            await notifier.notifyIfNeeded(report, stats, reportBenchmark);

            webhooksManagerFireWebhookStub.callCount.should.equal(2);
            webhooksManagerFireWebhookStub.args[0].should.containDeep([job, WEBHOOK_EVENT_TYPE_BENCHMARK_FAILED, report, { score, lastScores: ['20.0', '20.0', '20.6'], benchmarkThreshold }, { icon: ':cry:' }]);
            webhooksManagerFireWebhookStub.args[1].should.containDeep([job, WEBHOOK_EVENT_TYPE_FINISHED, report, { score }, { icon: ':rocket:' }]);

            reportEmailSenderStub.callCount.should.equal(1);
            reportEmailSenderStub.args[0].should.containDeep([aggregatedReport, job, job.emails, reportBenchmark]);
        });
        it('should fire 2 webhooks flows, 1 with BENCHMARK_FAILED and FINISHED with no 3 last scores', async function() {
            const job = {
                some: 'keys',
                emails: ['meow@catdomain.com']
            };
            const score = 20;
            const aggregatedReport = {
                special: 'key'
            };
            const report = {
                environment: 'test',
                report_id: 'report_id',
                test_id: 'test_id',
                test_name: 'some_test_name',
                duration: 10,
                arrival_rate: 10,
                parallelism: 2,
                ramp_to: 20,
                status: 'started',
                phase: 0,
                subscribers: [{ phase_status: SUBSCRIBER_DONE_STAGE }, { phase_status: SUBSCRIBER_DONE_STAGE }]

            };
            const stats = {
                phase_status: SUBSCRIBER_DONE_STAGE,
                data: JSON.stringify({})
            };
            const reports = [];
            const benchmarkThreshold = 30;
            const reportBenchmark = { score };

            getConfigStub.resolves(undefined);
            getConfigStub.withArgs(sinon.match('benchmark_threshold')).resolves(benchmarkThreshold);
            aggregateReportGeneratorStub.resolves(aggregatedReport);
            jobsManagerStub.resolves(job);
            getReportsStub.resolves(reports);

            await notifier.notifyIfNeeded(report, stats, reportBenchmark);

            webhooksManagerFireWebhookStub.callCount.should.equal(2);
            webhooksManagerFireWebhookStub.args[0].should.containDeep([job, WEBHOOK_EVENT_TYPE_BENCHMARK_FAILED, report, { score, lastScores: [], benchmarkThreshold }, { icon: ':cry:' }]);
            webhooksManagerFireWebhookStub.args[1].should.containDeep([job, WEBHOOK_EVENT_TYPE_FINISHED, report, { score }, { icon: ':rocket:' }]);

            reportEmailSenderStub.callCount.should.equal(1);
            reportEmailSenderStub.args[0].should.containDeep([aggregatedReport, job, job.emails, reportBenchmark]);
        });
    });

    it('handling message with phase: aborted', async () => {
        const job = {
            some: 'job',
            key: 'wow'
        };
        jobsManagerStub.resolves(job);
        const report = { test_name: 'test_name', environment: 'test', report_id: 'report_id', test_id: 'test_id' };
        const stats = {
            phase_status: SUBSCRIBER_ABORTED_STAGE,
            data: JSON.stringify({ message: 'fail to get test' })
        };
        await notifier.notifyIfNeeded(report, stats);

        webhooksManagerFireWebhookStub.callCount.should.equal(1);
        webhooksManagerFireWebhookStub.args[0].should.containDeep([job, WEBHOOK_EVENT_TYPE_ABORTED, report]);
        loggerInfoStub.callCount.should.equal(1);
    });

    it('handling message with unknown phase', async () => {
        const report = { test_name: 'test_name', environment: 'test', report_id: 'report_id', test_id: 'test_id' };
        const stats = {
            phase_status: 'unknown',
            data: JSON.stringify({ message: 'some unknown phase' })
        };

        await notifier.notifyIfNeeded(report, stats);
    });
})
;
