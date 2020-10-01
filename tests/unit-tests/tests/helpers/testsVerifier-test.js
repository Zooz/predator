const sinon = require('sinon'),
    should = require('should'),
    testsVerifier = require('../../../../src/tests/helpers/testsVerifier'),
    processorsManager = require('../../../../src/processors/models/processorsManager'),
    testManager = require('../../../../src/tests/models/manager');

describe('tests verifier tests', function () {
    let req, res, sandbox, nextStub, resJsonStub, resStatusStub, processorsManagerStub, testManagerStub;

    before(() => {
        sandbox = sinon.createSandbox();
        nextStub = sandbox.stub();
        resJsonStub = sandbox.stub();
        resStatusStub = sandbox.stub();

        processorsManagerStub = sandbox.stub(processorsManager, 'getProcessor');
        testManagerStub = sandbox.stub(testManager, 'getTest');
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
        it('Should pass tests validation', async () => {
            req = { params: { test_id: 1234 } };

            testManagerStub.resolves({});
            await testsVerifier.verifyTestExist(req, res, nextStub);
            should(nextStub.calledOnce).eql(true);
            should(nextStub.args[0][0]).eql(undefined);
            should(testManagerStub.calledOnce).eql(true);
        });
        it('Should fail to find tests', async () => {
            req = { params: { test_id: 1234 } };
            const err = new Error();
            err.statusCode = 404;
            testManagerStub.throws(err);
            await testsVerifier.verifyTestExist(req, res, nextStub);
            should(nextStub.calledOnce).eql(true);
            should(nextStub.args[0][0].statusCode).eql(404);
            should(testManagerStub.calledOnce).eql(true);
        });
        it('Should fail on unexpected error and return 500', async () => {
            req = { params: { test_id: 1234 } };
            const err = new Error();
            err.statusCode = 503;
            testManagerStub.throws(err);
            await testsVerifier.verifyTestExist(req, res, nextStub);
            should(nextStub.calledOnce).eql(true);
            should(nextStub.args[0][0].statusCode).eql(500);
            should(testManagerStub.calledOnce).eql(true);
        });
    });

    describe('verifyProcessorExists tests', () => {
        it('Should pass processor validation', async () => {
            req = { body: { processor_id: 'id', artillery_test: { before: { afterScenario: 'logResponse' } } } };

            processorsManagerStub.resolves({ exported_functions: ['logResponse'] });
            await testsVerifier.verifyProcessorIsValid(req, res, nextStub);
            should(nextStub.calledOnce).eql(true);
            should(nextStub.args[0][0]).eql(undefined);
            should(processorsManagerStub.calledOnce).eql(true);
        });

        it('Should fail on test that using function with processor', async () => {
            req = { body: { type: 'basic', artillery_test: { before: { afterScenario: 'logResponse', beforeScenario: 'xyz' } } } };

            processorsManagerStub.resolves({ exported_functions: ['logResponse'] });
            await testsVerifier.verifyProcessorIsValid(req, res, nextStub);
            should(nextStub.called).eql(true);
            should(nextStub.args[0][0].statusCode).eql(400);
            should(nextStub.args[0][0].message).eql('Functions: logResponse, xyz are used without specifying processor');
        });

        it('Should fail on processor validation due to using functions which are not part of the processor', async () => {
            req = { body: { processor_id: 'id', artillery_test: { before: { afterScenario: 'logResponse', beforeScenario: 'xyz' } } } };

            processorsManagerStub.resolves({ exported_functions: ['logResponse'] });
            await testsVerifier.verifyProcessorIsValid(req, res, nextStub);
            should(nextStub.called).eql(true);
            should(nextStub.args[0][0].statusCode).eql(400);
            should(nextStub.args[0][0].message).eql('Functions: xyz does not exist in the processor file');
        });

        it('Should fail on processor id validation when test not found', async () => {
            req = { body: { processor_id: 'id' } };

            processorsManagerStub.rejects({ statusCode: 404 });

            await testsVerifier.verifyProcessorIsValid(req, res, nextStub);
            should(nextStub.called).eql(true);
            should(nextStub.args[0][0].statusCode).eql(400);
            should(nextStub.args[0][0].message).eql('processor with id: id does not exist');
        });

        it('Should fail on processor id validation when error from performance framework api', async () => {
            req = { body: { processor_id: 'id' } };

            processorsManagerStub.rejects({ statusCode: 500, message: 'failure' });

            await testsVerifier.verifyProcessorIsValid(req, res, nextStub);
            should(nextStub.called).eql(true);
            should(nextStub.args[0][0].statusCode).eql(500);
            should(nextStub.args[0][0].message).eql('failure');
        });
    });
});
