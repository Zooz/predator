'use strict';

process.env.JOB_PLATFORM = 'DOCKER';

let sinon = require('sinon');
let should = require('should');
let logger = require('../../../../src/common/logger');
let reportWebhookSender = require('../../../../src/reports/models/reportWebhookSender');
let reportsManager = require('../../../../src/reports/models/reportsManager');
let request = require('request-promise-native');

const EXPECTED_REQUEST_SENDING_WEBHOOKS = [
    [
        {
            url: 'http://a.com',
            body: {
                text: 'some message',
                icon_emoji: ':muscle:',
                username: 'reporter'
            },
            json: true
        }
    ],
    [
        {
            url: 'http://b.com',
            body: {
                text: 'some message',
                icon_emoji: ':muscle:',
                username: 'reporter'
            },
            json: true
        }
    ]
];
describe('Report webhook sender test', () => {
    let sandbox, reportsManagerGetReportStub, loggerErrorStub, requestPostStub;

    before(() => {
        sandbox = sinon.sandbox.create();
        reportsManagerGetReportStub = sandbox.stub(reportsManager, 'getReport');
        loggerErrorStub = sandbox.stub(logger, 'error');
        requestPostStub = sandbox.stub(request, 'post');
    });

    beforeEach(() => {
        sandbox.resetHistory();
    });

    after(() => {
        sandbox.restore();
    });

    it('Send webhooks successfully when webhooks passed explicitly', async () => {
        requestPostStub.resolves({status: 201});
        await reportWebhookSender.send('testId', 'reportId', 'some message', ['http://a.com', 'http://b.com']);
        requestPostStub.callCount.should.equal(2);
        requestPostStub.args.should.containDeep(EXPECTED_REQUEST_SENDING_WEBHOOKS);
    });

    it('Send webhooks successfully when webhooks not passed but read from report', async () => {
        requestPostStub.resolves({status: 201});
        reportsManagerGetReportStub.resolves({webhooks: ['http://a.com', 'http://b.com']});
        await reportWebhookSender.send('testId', 'reportId', 'some message');
        requestPostStub.callCount.should.equal(2);
        requestPostStub.args.should.containDeep(EXPECTED_REQUEST_SENDING_WEBHOOKS);
    });

    it('No webhooks configured to be send', async () => {
        reportsManagerGetReportStub.resolves({webhooks: []});
        await reportWebhookSender.send('testId', 'reportId', 'some message');
        requestPostStub.callCount.should.equal(0);
    });

    it('Error retrieving report from reportsManager', async () => {
        requestPostStub.rejects({status: 500});
        reportsManagerGetReportStub.rejects(new Error('Database Error'));

        let testShouldFail = true;
        try {
            await reportWebhookSender.send('testId', 'reportId', 'some message');
        } catch (error) {
            testShouldFail = false;
            error.message.should.eql('Failed to retrieve report for testId: testId, reportId: reportId');
            loggerErrorStub.callCount.should.eql(1);
        }

        testShouldFail.should.eql(false, 'Test action was supposed to get exception');
    });

    it('reportsManager returned no report', async () => {
        let error = new Error('Report not found');
        error.statusCode = 404;
        reportsManagerGetReportStub.rejects(error);

        let testShouldFail = true;
        try {
            await reportWebhookSender.send('testId', 'reportId', 'some message');
        } catch (error) {
            testShouldFail = false;
            error.message.should.eql('Failed to retrieve report for testId: testId, reportId: reportId');
            loggerErrorStub.callCount.should.eql(1);
        }

        testShouldFail.should.eql(false, 'Test action was supposed to get exception');
    });
});