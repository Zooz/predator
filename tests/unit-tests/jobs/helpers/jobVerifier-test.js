const sinon = require('sinon'),
    should = require('should'),
    jobVerifier = require('../../../../src/jobs/helpers/jobVerifier'),
    testsManager = require('../../../../src/tests/models/manager'),
    configHandler = require('../../../../src/configManager/models/configHandler'),
    consts = require('../../../../src/common/consts');

describe('Jobs verifier tests', function () {
    let req, res, sandbox, nextStub, resJsonStub, resStatusStub, testsManagerStub, configHandlerStub;

    before(() => {
        sandbox = sinon.createSandbox();
        nextStub = sandbox.stub();
        resJsonStub = sandbox.stub();
        resStatusStub = sandbox.stub();
        configHandlerStub = sandbox.stub(configHandler, 'getConfigValue');
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
        configHandlerStub.resolves('KUBERNETES');
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
            req = { body: { run_immediately: true, cron_expression: '* * * * *', enabled: false } };
            await jobVerifier.verifyJobBody(req, res, nextStub);
            should(nextStub.args[0][0]).eql(undefined);
        });

        it('Run immediately is true and cron expression exist and enabled is true, should pass', async () => {
            req = { body: { run_immediately: true, cron_expression: '* * * * *', enabled: true } };
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
            req = { body: { run_immediately: false, cron_expression: '* * * * *' } };
            await jobVerifier.verifyJobBody(req, res, nextStub);
            should(nextStub.args[0][0]).eql(undefined);
        });
        it('Run immediately does not exits and cron expression exist, should pass', async () => {
            req = { body: { cron_expression: '* * * * *' } };
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

        it('Run immediately is false and cron expression exists, valid cron expression, should pass', async () => {
            req = { body: { run_immediately: false, cron_expression: '0 20 0 7 OCT *' } };
            await jobVerifier.verifyJobBody(req, res, nextStub);
            should(nextStub.args[0][0]).eql(undefined);
        });

        it('Run immediately is false and cron expression exists, cron expression w/ unsupported character, should fail', async () => {
            req = { body: { run_immediately: false, cron_expression: '0 20 0 7 OCT ? 2020' } };
            await jobVerifier.verifyJobBody(req, res, nextStub);
            should(nextStub.args[0][0].message).startWith('Unsupported cron_expression. ');
            should(nextStub.args[0][0].statusCode).eql(400);
        });

        it('Run immediately is false and cron expression exists, cron expression w/ too many fields, should fail', async () => {
            req = { body: { run_immediately: false, cron_expression: '0 20 0 7 OCT * 2020' } };
            await jobVerifier.verifyJobBody(req, res, nextStub);
            should(nextStub.args[0][0].message).startWith('Unsupported cron_expression. ');
            should(nextStub.args[0][0].statusCode).eql(400);
        });

        it('Run immediately is false and cron expression exists, cron expression w/ not enough fields, should fail', async () => {
            req = { body: { run_immediately: false, cron_expression: '* * *' } };
            await jobVerifier.verifyJobBody(req, res, nextStub);
            should(nextStub.args[0][0].message).startWith('Unsupported cron_expression. ');
            should(nextStub.args[0][0].statusCode).eql(400);
        });

        it('Run immediately with AWS FARGATE with tag in job body, should pass', async () => {
            configHandlerStub.withArgs(consts.CONFIG.JOB_PLATFORM).resolves('AWS_FARGATE');
            configHandlerStub.withArgs(consts.CONFIG.CUSTOM_RUNNER_DEFINITION).resolves({ hello: {} });
            req = { body: { run_immediately: true, tag: 'hello' } };
            await jobVerifier.verifyJobBody(req, res, nextStub);
            should(nextStub.args[0][0]).eql(undefined);
        });

        it('Run immediately with AWS FARGATE without tag in job body, should fail', async () => {
            configHandlerStub.withArgs(consts.CONFIG.JOB_PLATFORM).resolves('AWS_FARGATE');
            req = { body: { run_immediately: true } };
            await jobVerifier.verifyJobBody(req, res, nextStub);
            should(nextStub.args[0][0].message).eql('tag must be provided when JOB_PLATFORM is AWS_FARGATE');
            should(nextStub.args[0][0].statusCode).eql(400);
        });

        it('Run immediately with AWS FARGATE with tag in job body but tag not exists in custom runner definition, should fail', async () => {
            configHandlerStub.withArgs(consts.CONFIG.JOB_PLATFORM).resolves('AWS_FARGATE');
            configHandlerStub.withArgs(consts.CONFIG.CUSTOM_RUNNER_DEFINITION).resolves({ });
            req = { body: { run_immediately: true, tag: 'hello' } };
            await jobVerifier.verifyJobBody(req, res, nextStub);
            should(nextStub.args[0][0].message).eql('custom_runner_definition is missing key for tag: hello');
            should(nextStub.args[0][0].statusCode).eql(400);
        });
    });
});
