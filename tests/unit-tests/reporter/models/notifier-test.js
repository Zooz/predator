'use strict';

process.env.JOB_PLATFORM = 'DOCKER';

let sinon = require('sinon');
let should = require('should');
let logger = require('../../../../src/common/logger');
let notifier = require('../../../../src/reports/models/notifier');
let jobsManager = require('../../../../src/jobs/models/jobManager');
let reportWebhookSender = require('../../../../src/reports/models/reportWebhookSender');
let configHandler = require('../../../../src/configManager/models/configHandler');
let statsFormatter = require('../../../../src/reports/models/statsFormatter');
let aggregateReportGenerator = require('../../../../src/reports/models/aggregateReportGenerator');
let reportEmailSender = require('../../../../src/reports/models/reportEmailSender');

describe('Webhook/email notifier test ', () => {
    let sandbox, loggerInfoStub, loggerWarnStub, reportWebhookSenderSendStub,
        statsFormatterStub, jobsManagerStub, getConfigStub, aggregateReportGeneratorStub, reportEmailSenderStub;
    before(() => {
        sandbox = sinon.sandbox.create();
        loggerInfoStub = sandbox.stub(logger, 'info');
        loggerWarnStub = sandbox.stub(logger, 'warn');
        reportWebhookSenderSendStub = sandbox.stub(reportWebhookSender, 'send');
        statsFormatterStub = sandbox.stub(statsFormatter, 'getStatsFormatted');
        jobsManagerStub = sandbox.stub(jobsManager, 'getJob');
        getConfigStub = sandbox.stub(configHandler, 'getConfigValue');
        aggregateReportGeneratorStub = sandbox.stub(aggregateReportGenerator, 'createAggregateReport');
        reportEmailSenderStub = sandbox.stub(reportEmailSender, 'sendAggregateReport');
    });

    beforeEach(() => {
        sandbox.resetHistory();
    });

    after(() => {
        sandbox.restore();
    });

    it('Handing message with phase: error', async () => {
        jobsManagerStub.resolves({
            webhooks: ['http://www.zooz.com']
        });
        let report = { environment: 'test', report_id: 'report_id', test_id: 'test_id' };
        let stats = {
            phase_status: 'error',
            error: {
                'code': 500,
                'message': 'fail to get test'
            },
            data: JSON.stringify({ 'message': 'fail to get test' })
        };
        await notifier.notifyIfNeeded(report, stats);

        reportWebhookSenderSendStub.callCount.should.equal(1);
        reportWebhookSenderSendStub.args.should.containDeep([
            [
                '😞 *Test with id: test_id Failed*.\ntest configuration:\nenvironment: test\n{"message":"fail to get test"}',
                ['http://www.zooz.com']
            ]
        ]);
        loggerInfoStub.callCount.should.equal(1);
        loggerInfoStub.args.should.deepEqual([
            [
                {
                    'testId': 'test_id',
                    'reportId': 'report_id'
                },
                {
                    'code': 500,
                    'message': 'fail to get test'
                },
                'handling error message'
            ]
        ]);
    });

    describe('Handing message with phase: started_phase', () => {
        it('parallelism is 2 and ramp to is defined, runners in correct phases ', async () => {
            jobsManagerStub.resolves({
                webhooks: ['http://www.zooz.com', 'http://www.zooz2.com']
            });
            let report = {
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
                subscribers: [{ phase_status: 'started_phase' }, { phase_status: 'started_phase' }]

            };
            let stats = {
                phase_status: 'started_phase',
                data: JSON.stringify({ 'message': 'fail to get test' })
            };
            await notifier.notifyIfNeeded(report, stats);

            reportWebhookSenderSendStub.callCount.should.equal(1);
            reportWebhookSenderSendStub.args.should.containDeep([
                [
                    '🤓 *Test some_test_name with id: test_id has started*.\n\n     *test configuration:* environment: test duration: 10 seconds, arrival rate: 10 scenarios per second, number of runners: 2, ramp to: 20 scenarios per second',
                    ['http://www.zooz.com', 'http://www.zooz2.com']
                ]
            ]);
            loggerInfoStub.callCount.should.equal(1);
        });

        it('parallelism is not defined, runner in corrects phase ', async () => {
            jobsManagerStub.resolves({
                webhooks: ['http://www.zooz.com']
            });
            let report = {
                environment: 'test',
                report_id: 'report_id',
                test_id: 'test_id',
                test_name: 'some_test_name',
                duration: 10,
                arrival_rate: 10,
                subscribers: [{ phase_status: 'started_phase' }]
            };
            let stats = {
                phase_status: 'started_phase',
                data: JSON.stringify({ 'message': 'fail to get test' })
            };
            await notifier.notifyIfNeeded(report, stats);

            reportWebhookSenderSendStub.callCount.should.equal(1);
            reportWebhookSenderSendStub.args.should.containDeep([
                [
                    '🤓 *Test some_test_name with id: test_id has started*.\n\n     *test configuration:* environment: test duration: 10 seconds, arrival rate: 10 scenarios per second, number of runners: 1',
                    ['http://www.zooz.com']
                ]
            ]);
            loggerInfoStub.callCount.should.equal(1);
        });
    });

    it('parallelism is 2, runners in different phases', async () => {
        jobsManagerStub.resolves({
            webhooks: ['http://www.zooz.com', 'http://www.zooz2.com']
        });
        let report = {
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
            subscribers: [{ phase_status: 'started_phase' }, { phase_status: 'not_started_phase' }]

        };
        let stats = {
            phase_status: 'started_phase'
        };
        await notifier.notifyIfNeeded(report, stats);

        reportWebhookSenderSendStub.callCount.should.equal(0);
    });

    it('Handing message with phase: first_intermediate', async () => {
        aggregateReportGeneratorStub.resolves({});

        jobsManagerStub.resolves({
            webhooks: ['http://www.zooz.com']
        });
        let report = {
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
            subscribers: [{ phase_status: 'first_intermediate' }, { phase_status: 'first_intermediate' }]

        };
        let stats = {
            phase_status: 'first_intermediate',
            data: JSON.stringify({})
        };

        statsFormatterStub.returns('max: 1, min: 0.4, median: 0.7');

        await notifier.notifyIfNeeded(report, stats);

        reportWebhookSenderSendStub.callCount.should.equal(1);
        reportWebhookSenderSendStub.args.should.containDeep([
            [
                '🤔 *Test some_test_name with id: test_id first batch of results arrived for phase 0.*\nmax: 1, min: 0.4, median: 0.7\n',
                ['http://www.zooz.com']
            ]
        ]);
        loggerInfoStub.callCount.should.equal(1);
    });

    it('Handing message with phase: intermediate, not first message', async () => {
        jobsManagerStub.resolves({
            webhooks: ['http://www.zooz.com']
        });
        let report = {
            environment: 'test',
            report_id: 'report_id',
            test_id: 'test_id',
            test_name: 'some_test_name',
            duration: 10,
            arrival_rate: 10,
            parallelism: 5,
            ramp_to: 20,
            status: 'running',
            phase: 0
        };
        statsFormatterStub.returns('max: 1, min: 0.4, median: 0.7');
        let stats = {
            phase_status: 'intermediate',
            data: JSON.stringify({})
        };

        await notifier.notifyIfNeeded(report, stats);

        reportWebhookSenderSendStub.callCount.should.equal(0);
    });

    it('Handing message with phase: done', async () => {
        getConfigStub.resolves('test@predator.com');
        getConfigStub.withArgs(sinon.match('default_webhook_url')).resolves('http://www.webhook.com');
        getConfigStub.withArgs(sinon.match('default_email_address')).resolves('test@predator.com');

        aggregateReportGeneratorStub.resolves({});
        jobsManagerStub.resolves({
            webhooks: ['http://www.zooz.com'],
            emails: ['test2@predator.com']

        });
        let report = {
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
            subscribers: [{ phase_status: 'done' }, { phase_status: 'done' }]

        };
        let stats = {
            phase_status: 'done',
            data: JSON.stringify({})
        };

        statsFormatterStub.returns('max: 1, min: 0.4, median: 0.7');

        await notifier.notifyIfNeeded(report, stats, { score: 99.4 });

        reportWebhookSenderSendStub.callCount.should.equal(1);
        reportWebhookSenderSendStub.args.should.containDeep([
            [
                '😎 *Test some_test_name with id: test_id is finished.*\nmax: 1, min: 0.4, median: 0.7\n',
                ['http://www.zooz.com']
            ]
        ]);

        reportEmailSenderStub.callCount.should.equal(1);
        reportEmailSenderStub.args[0][2].should.containDeep(['test@predator.com', 'test2@predator.com']);
        loggerInfoStub.callCount.should.equal(1);
    });

    it('Handing message with phase: aborted', async () => {
        jobsManagerStub.resolves({
            webhooks: ['http://www.zooz.com']
        });
        let report = { test_name: 'test_name', environment: 'test', report_id: 'report_id', test_id: 'test_id' };
        let stats = {
            phase_status: 'aborted',
            data: JSON.stringify({ 'message': 'fail to get test' })
        };
        await notifier.notifyIfNeeded(report, stats);

        reportWebhookSenderSendStub.callCount.should.equal(1);
        reportWebhookSenderSendStub.args.should.containDeep([
            [
                '😢 *Test test_name with id: test_id was aborted.*\n',
                ['http://www.zooz.com']
            ]
        ]);
        loggerInfoStub.callCount.should.equal(1);
    });

    it('Handing message with unknown phase', async () => {
        let report = { test_name: 'test_name', environment: 'test', report_id: 'report_id', test_id: 'test_id' };
        let stats = {
            phase_status: 'unknown',
            data: JSON.stringify({ 'message': 'some unknown phase' })
        };

        await notifier.notifyIfNeeded(report, stats);
    });
})
;
