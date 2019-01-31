let sinon = require('sinon');
let should = require('should');
let request = require('request-promise-native');
let jobVerifier = require('../../../../src/jobs/helpers/jobVerifier');
let config = require('../../../../src/config/serviceConfig');

describe('Jobs verifier tests', function () {
    let req, res, sandbox, requestGetStub, nextStub, resJsonStub, resStatusStub;

    before(() => {
        sandbox = sinon.createSandbox();
        requestGetStub = sandbox.stub(request, 'get');
        nextStub = sandbox.stub();
        resJsonStub = sandbox.stub();
        resStatusStub = sandbox.stub();
        res = {
            json: (json) => {
                resJsonStub(json);
                return res;
            },
            status: (status) => {
                resStatusStub(status);
                return res;
            }
        };
    });

    beforeEach(() => {
        sandbox.resetHistory();
    });

    after(() => {
        sandbox.restore();
    });

    describe.skip('verifyTestExists tests', () => {
        it('Should pass test id validation', async () => {
            req = { body: { test_id: 'id' } };
            config.testsApiUrl = 'http://perf.zooz.com';
            requestGetStub.resolves({});
            await jobVerifier.verifyTestExists(req, res, nextStub);
            should(nextStub.calledOnce).eql(true);
            should(requestGetStub.calledOnce).eql(true);
            should(requestGetStub.args[0][0]).containDeep({
                url: 'http://perf.zooz.com/v1/tests/id',
                json: true,
                forever: true
            });
        });

        it('Should fail on test id validation when test not found', async () => {
            req = { body: { test_id: 'id' } };
            config.testsApiUrl = 'http://perf.zooz.com';
            requestGetStub.rejects({ statusCode: 404, message: 'failure' });
            let nextStub = sandbox.stub();
            await jobVerifier.verifyTestExists(req, res, nextStub);
            should(nextStub.called).eql(false);
            should(resJsonStub.calledOnce).eql(true);
            should(resJsonStub.args[0][0]).eql({ message: 'test with id: id does not exist' });
            should(resStatusStub.args[0][0]).eql(400);
        });

        it('Should fail on test id validation when error from performance framework api', async () => {
            req = { body: { test_id: 'id' } };
            config.testsApiUrl = 'http://perf.zooz.com';
            requestGetStub.rejects({ statusCode: 500, message: 'failure' });
            let nextStub = sandbox.stub();
            await jobVerifier.verifyTestExists(req, res, nextStub);
            should(nextStub.called).eql(false);
            should(resJsonStub.calledOnce).eql(true);
            should(resJsonStub.args[0][0]).eql({ message: 'failure' });
            should(resStatusStub.args[0][0]).eql(500);
        });
    });

    describe('verifyJobBody tests', () => {
        it('Run immediately is true and cron expression does not exist, should pass', async () => {
            req = { body: { run_immediately: true } };
            config.testsApiUrl = 'http://perf.zooz.com';
            await jobVerifier.verifyJobBody(req, res, nextStub);
            should(nextStub.calledOnce).eql(true);
        });

        it('Run immediately is true and cron expression exist, should pass', async () => {
            req = { body: { run_immediately: true, cron_expression: '* * *' } };
            config.testsApiUrl = 'http://perf.zooz.com';
            await jobVerifier.verifyJobBody(req, res, nextStub);
            should(nextStub.calledOnce).eql(true);
        });

        it('Run immediately is false and cron expression does not exist, should fail', async () => {
            req = { body: { run_immediately: false } };
            config.testsApiUrl = 'http://perf.zooz.com';
            await jobVerifier.verifyJobBody(req, res, nextStub);
            should(nextStub.calledOnce).eql(false);
        });

        it('Run immediately is false and cron expression exist, should pass', async () => {
            req = { body: { run_immediately: false, cron_expression: '* * *' } };
            config.testsApiUrl = 'http://perf.zooz.com';
            await jobVerifier.verifyJobBody(req, res, nextStub);
            should(nextStub.calledOnce).eql(true);
        });

        it('Run immediately does not exits and cron expression exist, should pass', async () => {
            req = { body: { cron_expression: '* * *' } };
            config.testsApiUrl = 'http://perf.zooz.com';
            await jobVerifier.verifyJobBody(req, res, nextStub);
            should(nextStub.calledOnce).eql(true);
        });

        it('Run immediately does not exits and cron expression does not exist, should pass', async () => {
            req = { body: {} };
            config.testsApiUrl = 'http://perf.zooz.com';
            await jobVerifier.verifyJobBody(req, res, nextStub);
            should(nextStub.calledOnce).eql(false);
        });
    });
});