'use strict';

process.env.JOB_PLATFORM = 'DOCKER';

let sinon = require('sinon');
let should = require('should');
let logger = require('../../../../src/common/logger');
let notifier = require('../../../../src/reports/models/notifier');
let reportEmailSender = require('../../../../src/reports/models/reportEmailSender');
let jobsManager = require('../../../../src/jobs/models/jobManager');
let reportWebhookSender = require('../../../../src/reports/models/reportWebhookSender');
let statsFormatter = require('../../../../src/reports/models/statsFormatter');

describe('Webhook/email notifier test', () => {
    let sandbox, loggerInfoStub, loggerWarnStub, reportWebhookSenderSendStub,
        statsFormatterStub, jobsManagerStub;
    before(() => {
        sandbox = sinon.sandbox.create();
        loggerInfoStub = sandbox.stub(logger, 'info');
        loggerWarnStub = sandbox.stub(logger, 'warn');
        reportWebhookSenderSendStub = sandbox.stub(reportWebhookSender, 'send');
        statsFormatterStub = sandbox.stub(statsFormatter, 'getStatsFormatted');
        jobsManagerStub = sandbox.stub(jobsManager, 'getJob');
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

    it('Handing message with phase: started', async () => {
        jobsManagerStub.resolves({
            webhooks: ['http://www.zooz.com']
        });
        let report = {
            environment: 'test',
            report_id: 'report_id',
            test_id: 'test_id',
            test_name: 'some_test_name',
            duration: 10,
            arrival_rate: 10
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

    it('Handing message with phase: started with parallelism and ramp to', async () => {
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
            parallelism: 5,
            ramp_to: 20,
            status: 'started',
            phase: '0'
        };
        let stats = {
            phase_status: 'started_phase',
            data: JSON.stringify({ 'message': 'fail to get test' })
        };
        await notifier.notifyIfNeeded(report, stats);

        reportWebhookSenderSendStub.callCount.should.equal(1);
        reportWebhookSenderSendStub.args.should.containDeep([
            [
                '🤓 *Test some_test_name with id: test_id has started*.\n\n     *test configuration:* environment: test duration: 10 seconds, arrival rate: 10 scenarios per second, number of runners: 5, ramp to: 20 scenarios per second',
                ['http://www.zooz.com']
            ]
        ]);
        loggerInfoStub.callCount.should.equal(1);
    });

    it('Handing message with phase: intermediate, first intermediate message', async () => {
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
            status: 'started',
            phase: 0
        };
        let stats = {
            phase_status: 'intermediate',
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
            status: 'started',
            phase: 0
        };
        let stats = {
            phase_status: 'done',
            data: JSON.stringify({})
        };

        statsFormatterStub.returns('max: 1, min: 0.4, median: 0.7');

        await notifier.notifyIfNeeded(report, stats);

        reportWebhookSenderSendStub.callCount.should.equal(1);
        reportWebhookSenderSendStub.args.should.containDeep([
            [
                '😎 *Test some_test_name with id: test_id is finished.*\nmax: 1, min: 0.4, median: 0.7\n',
                ['http://www.zooz.com']
            ]
        ]);
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
        loggerWarnStub.callCount.should.eql(1);
        loggerWarnStub.args.should.eql([
            [
                { testId: 'test_id', reportId: 'report_id' },
                'Handling unsupported test status: {"phase_status":"unknown","data":"{\\"message\\":\\"some unknown phase\\"}"}'
            ]
        ]);
    });
});