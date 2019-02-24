'use strict';

process.env.JOB_PLATFORM = 'DOCKER';

let sinon = require('sinon');
let should = require('should');
let rewire = require('rewire');
let logger = require('../../../../src/common/logger');
let statsConsumer = rewire('../../../../src/reports/models/statsConsumer');
let reportEmailSender = require('../../../../src/reports/models/reportEmailSender');
let reportsManager = require('../../../../src/reports/models/reportsManager');
let jobsManager = require('../../../../src/jobs/models/jobManager');
let reportWebhookSender = require('../../../../src/reports/models/reportWebhookSender');
let statsFormatter = require('../../../../src/reports/models/statsFormatter');
let artilleryReportGenerator = require('../../../../src/reports/models/artilleryReportGenerator');
let databaseConnector = require('../../../../src/reports/models/databaseConnector');

describe('Stats consumer test', () => {
    let sandbox, databaseConnectorInsertSummaryStub, databaseConnectorUpdateSummaryStub, databaseConnectorInsertStatsStub,
        databaseConnectorGetSummaryStub, loggerInfoStub, loggerWarnStub, reportWebhookSenderSendStub, statsFormatterStub,
        artilleryReportGeneratorStub, reportEmailSenderSendStub, reportsManagerStub, jobsManagerStub, dateGetTimeStub;

    before(() => {
        sandbox = sinon.sandbox.create();
        const date = new Date();
        dateGetTimeStub = sandbox.stub(date, 'getTime');
        databaseConnectorInsertSummaryStub = sandbox.stub(databaseConnector, 'insertReport');
        databaseConnectorUpdateSummaryStub = sandbox.stub(databaseConnector, 'updateReport');
        databaseConnectorInsertStatsStub = sandbox.stub(databaseConnector, 'insertStats');
        databaseConnectorGetSummaryStub = sandbox.stub(databaseConnector, 'getReport');

        loggerInfoStub = sandbox.stub(logger, 'info');
        loggerWarnStub = sandbox.stub(logger, 'warn');
        reportWebhookSenderSendStub = sandbox.stub(reportWebhookSender, 'send');
        statsFormatterStub = sandbox.stub(statsFormatter, 'getStatsFormatted');
        artilleryReportGeneratorStub = sandbox.stub(artilleryReportGenerator, 'createArtilleryReport');
        reportEmailSenderSendStub = sandbox.stub(reportEmailSender, 'sendAggregateReport');
        reportsManagerStub = sandbox.stub(reportsManager, 'getReport');
        jobsManagerStub = sandbox.stub(jobsManager, 'getJob');
        statsConsumer.__set__('serviceConfig.externalAddress', 'http://www.zooz.com/v1');
    });

    beforeEach(() => {
        sandbox.resetHistory();
    });

    after(() => {
        sandbox.restore();
    });

    it('Handing message with phase: error', async () => {
        const statsTime = Date.now().toString();
        reportsManagerStub.resolves({
            status: 'failed',
            test_id: 'test_id',
            report_id: 'report_id',
            environment: 'test',
            test_name: 'some_test_name'
        });
        jobsManagerStub.resolves({
            webhooks: ['http://www.zooz.com']
        });
        databaseConnectorUpdateSummaryStub.resolves();
        await statsConsumer.handleMessage('test_id', 'report_id', {stats_time: statsTime, phase_status: 'error', data: JSON.stringify({message: 'fail to get test'}), error: {code: 500, message: 'fail to get test'}});

        reportWebhookSenderSendStub.callCount.should.equal(1);
        reportWebhookSenderSendStub.args.should.containDeep([
            [
                'test_id',
                'report_id',
                '😞 *Test with id: test_id Failed*.\ntest configuration:\nenvironment: test\n{"message":"fail to get test"}',
                [ 'http://www.zooz.com' ]
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
        const statsTime = Date.now().toString();
        databaseConnectorInsertSummaryStub.resolves();
        databaseConnectorUpdateSummaryStub.resolves();
        reportWebhookSenderSendStub.resolves();
        reportsManagerStub.resolves({
            test_id: 'test_id',
            report_id: 'report_id',
            status: 'initialized',
            phase: 0,
            test_name: 'some_test_name',
            webhooks: ['http://www.zooz.com'],
            arrival_rate: 100,
            duration: 10,
            environment: 'test'
        });
        jobsManagerStub.resolves({
            webhooks: ['http://www.zooz.com']
        });
        await statsConsumer.handleMessage('test_id', 'report_id', {stats_time: statsTime, phase_status: 'started_phase', data: JSON.stringify({ info: {duration: 10, arrivalRate: 100} })});

        databaseConnectorUpdateSummaryStub.callCount.should.equal(1);
        databaseConnectorUpdateSummaryStub.args.should.containDeep([
            [
                'test_id',
                'report_id'
            ]
        ]);

        reportWebhookSenderSendStub.callCount.should.equal(1);
        reportWebhookSenderSendStub.args.should.containDeep([
            [
                'test_id',
                'report_id',
                '🤓 *Test some_test_name with id: test_id has started*.\n\n         *test configuration:* environment: test duration: 10 seconds, arrival rate: 100 scenarios per second, number of runners: 1',
                ['http://www.zooz.com']
            ]
        ]);

        loggerInfoStub.callCount.should.equal(1);
        loggerInfoStub.args.should.deepEqual([
            [
                {
                    'reportId': 'report_id',
                    'testId': 'test_id'
                },
                {
                    'info': {
                        'arrivalRate': 100,
                        'duration': 10
                    }
                },
                'handling started message'
            ]
        ]);
    });

    it('Handing message with phase: intermediate, first intermediate message', async () => {
        const statsTime = Date.now().toString();
        statsConsumer.__set__('serviceConfig.grafanaUrl', 'http://www.grafana.com');

        databaseConnectorInsertStatsStub.resolves();
        databaseConnectorUpdateSummaryStub.resolves();
        databaseConnectorGetSummaryStub.resolves({rows: [{status: 'started', start_time: 123456}]});
        reportWebhookSenderSendStub.resolves();
        reportsManagerStub.resolves({
            test_id: 'test_id',
            start_time: '12345',
            report_id: 1,
            test_name: 'some_test_name',
            phase: 0,
            status: 'started',
            grafana_report: `http://www.grafana.com&var-Name=some_test_name&from=${new Date('12345').getTime()}`
        });
        jobsManagerStub.resolves({
            webhooks: ['http://www.zooz.com']
        });

        dateGetTimeStub.onCall(0).returns(327403375200000);

        statsFormatterStub.returns('max: 1, min: 0.4, median: 0.7');

        await statsConsumer.handleMessage('test_id', 1, {container_id: 'container_id', stats_time: statsTime, phase_status: 'intermediate', data: JSON.stringify({ report: {reportId: 1} })});

        reportWebhookSenderSendStub.callCount.should.equal(1);
        reportWebhookSenderSendStub.args.should.containDeep([
            [
                'test_id',
                1,
                `🤔 *Test some_test_name with id: test_id first batch of results arrived for phase 0.*\nmax: 1, min: 0.4, median: 0.7\n<http://www.zooz.com/v1/tests/test_id/reports/1/html|Track report in html report>\n<http://www.grafana.com&var-Name=some_test_name&from=${new Date('12345').getTime()}|Track report in grafana dashboard>`,
                ['http://www.zooz.com']
            ]
        ]);
        loggerInfoStub.callCount.should.equal(1);
        loggerInfoStub.args.should.deepEqual([
            [
                { testId: 'test_id', reportId: 1 },
                'handling intermediate message'
            ]
        ]);

        databaseConnectorInsertStatsStub.callCount.should.eql(1);
        databaseConnectorInsertStatsStub.args[0][0].should.eql('container_id');
        databaseConnectorInsertStatsStub.args[0][1].should.eql('test_id');
        databaseConnectorInsertStatsStub.args[0][2].should.eql(1);
        databaseConnectorInsertStatsStub.args[0][3].should.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
        databaseConnectorInsertStatsStub.args[0][4].should.eql(new Date(Number(statsTime)));
        databaseConnectorInsertStatsStub.args[0][5].should.eql(0);
        databaseConnectorInsertStatsStub.args[0][6].should.eql('intermediate');
        databaseConnectorInsertStatsStub.args[0][7].should.eql(JSON.stringify({report: {reportId: 1 }}));

        databaseConnectorUpdateSummaryStub.callCount.should.eql(1);
        databaseConnectorUpdateSummaryStub.args.should.eql([[ 'test_id', 1, 'in_progress', 0, JSON.stringify({report: {reportId: 1 }}), undefined ]]);
    });

    it('Handing message with phase: intermediate, not first message', async () => {
        const statsTime = Date.now().toString();
        databaseConnectorInsertStatsStub.resolves();
        databaseConnectorUpdateSummaryStub.resolves();
        databaseConnectorGetSummaryStub.resolves({rows: [{status: 'in_progress'}]});
        reportWebhookSenderSendStub.resolves();
        reportsManagerStub.resolves({
            test_id: 'test_id',
            start_time: '12345',
            end_time: '123456',
            report_id: 1,
            phase: 0,
            status: 'in_progress'
        });
        jobsManagerStub.resolves({
            webhooks: ['http://www.zooz.com']
        });

        statsFormatterStub.returns('max: 1, min: 0.4, median: 0.7');

        await statsConsumer.handleMessage('test_id', 1, {container_id: 'container_id', stats_time: statsTime, phase_status: 'intermediate', data: JSON.stringify({ report: {reportId: 1} })});

        reportWebhookSenderSendStub.callCount.should.equal(0);
        loggerInfoStub.callCount.should.equal(1);
        loggerInfoStub.args.should.deepEqual([
            [
                { testId: 'test_id', reportId: 1},
                'handling intermediate message'
            ]
        ]);

        databaseConnectorInsertStatsStub.callCount.should.eql(1);
        databaseConnectorInsertStatsStub.args[0][0].should.eql('container_id');
        databaseConnectorInsertStatsStub.args[0][1].should.eql('test_id');
        databaseConnectorInsertStatsStub.args[0][2].should.eql(1);
        databaseConnectorInsertStatsStub.args[0][3].should.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
        databaseConnectorInsertStatsStub.args[0][4].should.eql(new Date(Number(statsTime)));
        databaseConnectorInsertStatsStub.args[0][5].should.eql(0);
        databaseConnectorInsertStatsStub.args[0][6].should.eql('intermediate');
        databaseConnectorInsertStatsStub.args[0][7].should.eql(JSON.stringify({ report: {reportId: 1} }));

        databaseConnectorUpdateSummaryStub.callCount.should.eql(1);
        databaseConnectorUpdateSummaryStub.args.should.eql([[ 'test_id', 1, 'in_progress', 0, JSON.stringify({ report: {reportId: 1} }), undefined ]]);
    });

    it('Handing message with phase: done', async () => {
        const statsTime = Date.now().toString();
        statsConsumer.__set__('serviceConfig.grafanaUrl', 'http://www.grafana.com');

        databaseConnectorGetSummaryStub.resolves({rows: [{status: 'in_progress', start_time: 123456, end_time: 24567}]});
        databaseConnectorInsertStatsStub.resolves();
        databaseConnectorUpdateSummaryStub.resolves();
        reportWebhookSenderSendStub.resolves();
        artilleryReportGeneratorStub.resolves();
        reportsManagerStub.resolves({
            test_id: 'test_id',
            start_time: '12345',
            end_time: '123456',
            report_id: 1,
            phase: 0,
            test_name: 'some_test_name',
            grafana_report: `http://www.grafana.com&var-Name=some_test_name&from=${new Date('12345').getTime()}&to=${new Date('123456').getTime()}`
        });
        jobsManagerStub.resolves({
            webhooks: ['http://www.zooz.com'],
            emails: ['mickey@gmail.com']
        });

        statsFormatterStub.returns('max: 1, min: 0.4, median: 0.7');

        await statsConsumer.handleMessage('test_id', 1, {container_id: 'container_id', stats_time: statsTime, phase_status: 'done', data: JSON.stringify({ report: {reportId: 1} })});

        reportWebhookSenderSendStub.callCount.should.equal(1);
        reportWebhookSenderSendStub.args.should.containDeep([
            [
                'test_id',
                1,
                `😎 *Test some_test_name with id: test_id is finished.*\nmax: 1, min: 0.4, median: 0.7\n<http://www.zooz.com/v1/tests/test_id/reports/1/html|View final html report>\n<http://www.grafana.com&var-Name=some_test_name&from=${new Date('12345').getTime()}&to=${new Date('123456').getTime()}|View final grafana dashboard report>`,
                [ 'http://www.zooz.com' ]
            ]
        ]);

        reportEmailSenderSendStub.callCount.should.equal(1);
        reportEmailSenderSendStub.args.should.containDeep([
            [
                'test_id',
                1,
                'http://www.zooz.com/v1/tests/test_id/reports/1/html',
                `http://www.grafana.com&var-Name=some_test_name&from=${new Date('12345').getTime()}&to=${new Date('123456').getTime()}`
            ]
        ]);

        loggerInfoStub.callCount.should.equal(1);
        loggerInfoStub.args.should.deepEqual([
            [
                { testId: 'test_id', reportId: 1 },
                'handling done message'
            ]
        ]);

        databaseConnectorInsertStatsStub.callCount.should.eql(1);
        databaseConnectorInsertStatsStub.args[0][0].should.eql('container_id');
        databaseConnectorInsertStatsStub.args[0][1].should.eql('test_id');
        databaseConnectorInsertStatsStub.args[0][2].should.eql(1);
        databaseConnectorInsertStatsStub.args[0][3].should.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
        databaseConnectorInsertStatsStub.args[0][4].should.eql(new Date(Number(statsTime)));
        databaseConnectorInsertStatsStub.args[0][5].should.eql(0);
        databaseConnectorInsertStatsStub.args[0][6].should.eql('aggregate');
        databaseConnectorInsertStatsStub.args[0][7].should.eql(JSON.stringify({report: {reportId: 1 }}));

        databaseConnectorUpdateSummaryStub.callCount.should.eql(1);
        databaseConnectorUpdateSummaryStub.args.should.eql([[ 'test_id', 1, 'finished', 0, JSON.stringify({report: {reportId: 1 }}), new Date(Number(statsTime)) ]]);
    });

    it('Handing message with phase: aborted', async () => {
        const statsTime = Date.now().toString();
        statsConsumer.__set__('serviceConfig.grafanaUrl', 'http://www.grafana.com');

        databaseConnectorGetSummaryStub.resolves({rows: [{status: 'started', start_time: 123456, end_time: 24567}]});
        databaseConnectorInsertStatsStub.resolves();
        databaseConnectorUpdateSummaryStub.resolves();
        reportWebhookSenderSendStub.resolves();
        artilleryReportGeneratorStub.resolves();
        reportsManagerStub.resolves({
            test_id: 'test_id',
            start_time: '12345',
            end_time: '123456',
            report_id: 1,
            phase: 0,
            test_name: 'some_test_name',
            webhooks: ['http://www.zooz.com'],
            grafana_report: `http://www.grafana.com&var-Name=some_test_name&from=${new Date('12345').getTime()}&to=${new Date('123456').getTime()}`
        });
        jobsManagerStub.resolves({
            webhooks: ['http://www.zooz.com']
        });

        statsFormatterStub.returns('max: 1, min: 0.4, median: 0.7');

        await statsConsumer.handleMessage('test_id', 1, {container_id: 'container_id', stats_time: statsTime, phase_status: 'aborted', data: JSON.stringify({revisionId: 'revision_id', webhooks: ['http://www.zooz.com'], testId: 'test_id', runId: 'run_id', environment: 'test'})});

        reportWebhookSenderSendStub.callCount.should.equal(1);
        reportWebhookSenderSendStub.args.should.containDeep([
            [
                'test_id',
                1,
                `😢 *Test some_test_name with id: test_id was aborted.*\n<http://www.zooz.com/v1/tests/test_id/reports/1/html|View final html report>\n<http://www.grafana.com&var-Name=some_test_name&from=${new Date('12345').getTime()}&to=${new Date('123456').getTime()}|View final grafana dashboard report>`,
                [ 'http://www.zooz.com' ]
            ]
        ]);

        reportEmailSenderSendStub.callCount.should.equal(0);

        databaseConnectorInsertStatsStub.callCount.should.eql(0);
        databaseConnectorUpdateSummaryStub.callCount.should.eql(1);
        databaseConnectorUpdateSummaryStub.args.should.eql([[ 'test_id', 1, 'aborted', 0, undefined, new Date(Number(statsTime)) ]]);
    });

    it('Handing message with unknown phase', async () => {
        reportsManagerStub.resolves({});
        await statsConsumer.handleMessage('test_id', 1, { data: JSON.stringify({}) });
        loggerWarnStub.callCount.should.eql(1);
        loggerWarnStub.args.should.eql([
            [
                { reportId: 1, testId: 'test_id' },
                'Handling unsupported test status: {"data":"{}"}'
            ]
        ]);
    });
});