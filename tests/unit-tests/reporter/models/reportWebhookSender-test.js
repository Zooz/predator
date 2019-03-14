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

    it('Send webhooks successfully when webhooks not passed but read from report', async () => {
        requestPostStub.resolves({ status: 201 });
        const JOB = { webhooks: ['http://a.com', 'http://b.com'] };
        await reportWebhookSender.send(JOB.webhooks , 'some message');
        requestPostStub.callCount.should.equal(2);
        requestPostStub.args.should.containDeep(EXPECTED_REQUEST_SENDING_WEBHOOKS);
    });

    it('No webhooks configured to be send', async () => {
        const JOB = {webhooks: []};
        await reportWebhookSender.send(JOB.webhooks, 'some message');
        requestPostStub.callCount.should.equal(0);
    });
});