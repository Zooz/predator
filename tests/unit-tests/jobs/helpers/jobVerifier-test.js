const sinon = require('sinon'),
    should = require('should'),
    jobVerifier = require('../../../../src/jobs/helpers/jobVerifier'),
    testsManager = require('../../../../src/tests/models/manager');

describe('Jobs verifier tests', function () {
    let req, res, sandbox, nextStub, resJsonStub, resStatusStub, testsManagerStub;

    before(() => {
        sandbox = sinon.createSandbox();
        nextStub = sandbox.stub();
        resJsonStub = sandbox.stub();
        resStatusStub = sandbox.stub();

        testsManagerStub = sandbox.stub(testsManager, 'getTest');

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

    describe('verifyTestExists tests', () => {
        it('Should pass test id validation', async () => {
            req = { body: { test_id: 'id' } };

            testsManagerStub.resolves();
            await jobVerifier.verifyTestExists(req, res, nextStub);
            should(nextStub.calledOnce).eql(true);
            should(testsManagerStub.calledOnce).eql(true);
        });

        it('Should fail on test id validation when test not found', async () => {
            req = { body: { test_id: 'id' } };

            testsManagerStub.rejects({ statusCode: 404 });

            await jobVerifier.verifyTestExists(req, res, nextStub);
            should(nextStub.called).eql(true);
            should(nextStub.args[0][0].message).eql('test with id: id does not exist');
            should(nextStub.args[0][0].statusCode).eql(400);
        });

        it('Should fail on test id validation when error from performance framework api', async () => {
            req = { body: { test_id: 'id' } };

            testsManagerStub.rejects({ statusCode: 500, message: 'failure' });

            await jobVerifier.verifyTestExists(req, res, nextStub);
            should(nextStub.called).eql(true);
            should(nextStub.args[0][0].message).eql('failure');
            should(nextStub.args[0][0].statusCode).eql(500);
        });
    });

    describe('verifyJobBody tests', () => {
        it('Run immediately is true and cron expression does not exist, should pass', async () => {
            req = { body: { run_immediately: true } };
            await jobVerifier.verifyJobBody(req, res, nextStub);
            should(nextStub.args[0][0]).eql(undefined);
        });

        it('Run immediately is true and cron expression exist and enabled is false, should pass', async () => {
            req = { body: { run_immediately: true, cron_expression: '* * *', enabled: false } };
            await jobVerifier.verifyJobBody(req, res, nextStub);
            should(nextStub.args[0][0]).eql(undefined);
        });

        it('Run immediately is true and cron expression exist and enabled is true, should pass', async () => {
            req = { body: { run_immediately: true, cron_expression: '* * *', enabled: true } };
            await jobVerifier.verifyJobBody(req, res, nextStub);
            should(nextStub.args[0][0]).eql(undefined);
        });

        it('Run immediately is false and cron expression does not exist, should fail', async () => {
            req = { body: { run_immediately: false } };
            await jobVerifier.verifyJobBody(req, res, nextStub);
            should(nextStub.args[0][0].message).eql('Please provide run_immediately or cron_expression in order to schedule a job');
            should(nextStub.args[0][0].statusCode).eql(400);
        });

        it('Run immediately is false and cron expression exist, should pass', async () => {
            req = { body: { run_immediately: false, cron_expression: '* * *' } };
            await jobVerifier.verifyJobBody(req, res, nextStub);
            should(nextStub.args[0][0]).eql(undefined);
        });
        it('Run immediately does not exits and cron expression exist, should pass', async () => {
            req = { body: { cron_expression: '* * *' } };
            await jobVerifier.verifyJobBody(req, res, nextStub);
            should(nextStub.args[0][0]).eql(undefined);
        });

        it('Run immediately does not exits and cron expression does not exist, should fail', async () => {
            req = { body: {} };
            await jobVerifier.verifyJobBody(req, res, nextStub);
            should(nextStub.args[0][0].message).eql('Please provide run_immediately or cron_expression in order to schedule a job');
            should(nextStub.args[0][0].statusCode).eql(400);
        });

        it('Run immediately exists with enabled false, should fail', async () => {
            req = { body: { run_immediately: true, enabled: false } };
            await jobVerifier.verifyJobBody(req, res, nextStub);
            should(nextStub.args[0][0].message).eql('It is impossible to disable job without cron_expression');
            should(nextStub.args[0][0].statusCode).eql(400);
        });

        it('Run immediately exists with enabled true, should pass', async () => {
            req = { body: { run_immediately: true, enabled: true } };
            await jobVerifier.verifyJobBody(req, res, nextStub);
            await jobVerifier.verifyJobBody(req, res, nextStub);
            should(nextStub.args[0][0]).eql(undefined);
        });
    });
});