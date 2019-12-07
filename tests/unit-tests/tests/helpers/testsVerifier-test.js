const sinon = require('sinon'),
    should = require('should'),
    testsVerifier = require('../../../../src/tests/helpers/testsVerifier'),
    processorsManager = require('../../../../src/processors/models/processorsManager');

describe('tests verifier tests', function () {
    let req, res, sandbox, nextStub, resJsonStub, resStatusStub, processorsManagerStub;

    before(() => {
        sandbox = sinon.createSandbox();
        nextStub = sandbox.stub();
        resJsonStub = sandbox.stub();
        resStatusStub = sandbox.stub();

        processorsManagerStub = sandbox.stub(processorsManager, 'getProcessor');

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

    describe('verifyProcessorExists tests', () => {
        it('Should pass processor id validation', async () => {
            req = { body: { processor_id: 'id' } };

            processorsManagerStub.resolves();
            await testsVerifier.verifyProcessorExists(req, res, nextStub);
            should(nextStub.calledOnce).eql(true);
            should(processorsManagerStub.calledOnce).eql(true);
        });

        it('Should fail on processor id validation when test not found', async () => {
            req = { body: { processor_id: 'id' } };

            processorsManagerStub.rejects({ statusCode: 404 });

            await testsVerifier.verifyProcessorExists(req, res, nextStub);
            should(nextStub.called).eql(true);
            should(nextStub.args[0][0].message).eql('processor with id: id does not exist');
            should(nextStub.args[0][0].statusCode).eql(400);
        });

        it('Should fail on processor id validation when error from performance framework api', async () => {
            req = { body: { processor_id: 'id' } };

            processorsManagerStub.rejects({ statusCode: 500, message: 'failure' });

            await testsVerifier.verifyProcessorExists(req, res, nextStub);
            should(nextStub.called).eql(true);
            should(nextStub.args[0][0].message).eql('failure');
            should(nextStub.args[0][0].statusCode).eql(500);
        });
    });
});