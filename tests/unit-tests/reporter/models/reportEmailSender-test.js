'use strict';

process.env.JOB_PLATFORM = 'DOCKER';

let sinon = require('sinon');
let should = require('should');
let logger = require('../../../../src/common/logger');
let reportEmailSender = require('../../../../src/reports/models/reportEmailSender');
let aggregateReportGenerator = require('../../../../src/reports/models/aggregateReportGenerator');
let configHandler = require('../../../../src/configManager/models/configHandler');
let nodemailer = require('nodemailer');

const AGGREGATE_REPORT = {
    'test_name': 'test name',
    'test_id': 'test_id',
    'report_id': 'report_id',
    aggregate: {
        'timestamp': '2018-05-28T15:40:10.044Z',
        'scenariosCreated': 289448,
        'scenariosCompleted': 289447,
        'requestsCompleted': 694611,
        'latency': {
            'min': 6.3,
            'max': 3822.8,
            'median': 58.8,
            'p95': 115.5,
            'p99': 189.4
        },
        'rps': {
            'count': 694611,
            'mean': 178.61
        },
        'scenarioDuration': {
            'min': 80.4,
            'max': 5251.7,
            'median': 146.8,
            'p95': 244.4,
            'p99': 366.6
        },
        'scenarioCounts': {
            'Create token and get token': 173732,
            'Create token, create customer and assign token to customer': 115716
        },
        'errors': { EAI_AGAIN: 112, NOTREACH: 123 },
        'codes': {
            '200': 173732,
            '201': 520878,
            '503': 1
        },
        'matches': 0,
        'customStats': {},
        'concurrency': 1510,
        'pendingRequests': 1471
    }
};

const JOB = {
    'emails': 'eli@zooz.com'
};

const CONFIG = {
    port: 111,
    host: 'smtp_host_test',
    timeout: 222
};

const transporter = {
    sendMail: () => { },
    close: () => { }
};

describe('Report emails sender test', () => {
    let sandbox, loggerErrorStub, loggerInfoStub, nodemailerCreateTransportStub, sendMailStub, getConfig, aggregateReportGeneratorStub;

    before(() => {
        sandbox = sinon.sandbox.create();
        loggerErrorStub = sandbox.stub(logger, 'error');
        loggerInfoStub = sandbox.stub(logger, 'info');
        getConfig = sandbox.stub(configHandler, 'getConfigValue');
        nodemailerCreateTransportStub = sandbox.stub(nodemailer, 'createTransport');
        sendMailStub = sandbox.stub(transporter, 'sendMail');
        aggregateReportGeneratorStub = sandbox.stub(aggregateReportGenerator, 'createAggregateReport');
    });

    beforeEach(() => {
        sandbox.resetHistory();
    });

    after(() => {
        sandbox.restore();
    });

    it('Send aggregate report successfully', async () => {
        sendMailStub.resolves({ status: 201 });
        nodemailerCreateTransportStub.returns(transporter);
        aggregateReportGeneratorStub.resolves(AGGREGATE_REPORT);
        getConfig.resolves({ from: 'Predator 💪 <performance@predator.com>' });

        await reportEmailSender.sendAggregateReport(AGGREGATE_REPORT, JOB, ['eli@zooz.com']);

        sendMailStub.callCount.should.equal(1);
        sendMailStub.args.should.containDeep([
            [
                {
                    from: 'Predator 💪 <performance@predator.com>',
                    to: [JOB.emails].join(','),
                    subject: 'Your test results: test name'

                }
            ]
        ]);

        loggerInfoStub.callCount.should.equal(1);
        loggerInfoStub.args.should.deepEqual([
            [
                { status: 201 },
                'Sent email successfully for testId: test_id, reportId: report_id'
            ]
        ]);
    });

    it('Send aggregate report successfully with benchmark data', async () => {
        sendMailStub.resolves({ status: 201 });
        nodemailerCreateTransportStub.returns(transporter);
        aggregateReportGeneratorStub.resolves(AGGREGATE_REPORT);
        getConfig.resolves({ from: 'Predator 💪 <performance@predator.com>' });
        const benchmarkData = { score: 95,
            data: { rps: { score: 10, percentage: 0.2 },
                percentile_ninety_five: { score: 10, percentage: 0.2 },
                percentile_fifty: { score: 10, percentage: 0.2 },
                client_errors_ratio: { score: 10, percentage: 0.2 },
                server_errors_ratio: { score: 10, percentage: 0.2 } } };
        await reportEmailSender.sendAggregateReport(AGGREGATE_REPORT, JOB, ['eli@zooz.com'], benchmarkData);

        sendMailStub.callCount.should.equal(1);
        sendMailStub.args.should.containDeep([
            [
                {
                    from: 'Predator 💪 <performance@predator.com>',
                    to: [JOB.emails].join(','),
                    subject: 'Your test results: test name with score: 95.00'

                }
            ]
        ]);

        loggerInfoStub.callCount.should.equal(1);
        loggerInfoStub.args.should.deepEqual([
            [
                { status: 201 },
                'Sent email successfully for testId: test_id, reportId: report_id'
            ]
        ]);
    });

    it('Send aggregate report fails because of error invoking smtp client', async () => {
        const error = new Error('Failed to connect to SMTP client');
        sendMailStub.resolves({ status: 201 });
        aggregateReportGeneratorStub.resolves(AGGREGATE_REPORT);
        nodemailerCreateTransportStub.throws(error);

        await reportEmailSender.sendAggregateReport(AGGREGATE_REPORT, JOB, ['eli@zooz.com']);

        loggerErrorStub.callCount.should.equal(1);
        loggerErrorStub.args[0][0].should.eql(error);
    });

    it('Verify transporter options', async () => {
        sendMailStub.resolves({ status: 201 });
        aggregateReportGeneratorStub.resolves(AGGREGATE_REPORT);
        getConfig.resolves(CONFIG);
        nodemailerCreateTransportStub.returns(transporter);
        await reportEmailSender.sendAggregateReport(AGGREGATE_REPORT, JOB, ['eli@zooz.com']);
        should(nodemailerCreateTransportStub.args[0][0].host).eql('smtp_host_test');
        should(nodemailerCreateTransportStub.args[0][0].port).eql(111);
        should(nodemailerCreateTransportStub.args[0][0].connectionTimeout).eql(222);
    });
});