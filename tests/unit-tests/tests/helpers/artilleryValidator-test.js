let sinon = require('sinon');
let should = require('should');
let artilleryValidator = require('../../../../src/tests/helpers/artilleryValidator');
let consts = require('../../../../src/common/consts');

describe('Artillery validator tests', function () {
    let req, res, sandbox, nextStub, resJsonStub, resStatusStub;

    before(() => {
        sandbox = sinon.createSandbox();
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

    describe('Verify artillery valid tests', () => {
        it('The artillery json is a valid json', async () => {
            let validArtilleryJson = {
                config: {
                    target: '',
                    http: {
                        pool: 100
                    },
                    phases: [{
                        duration: 0,
                        arrivalRate: 0 }]
                },
                scenarios: [{
                    name: 'Assign token to customer',
                    flow: [{
                        post: {
                            url: '/payments',
                            capture: {
                                json: '$.id',
                                as: 'paymentId'
                            },
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            json: {
                                currency: 'USD',
                                amount: 5
                            }
                        }
                    }]
                }]
            };

            req = { body: { type: consts.TEST_TYPE_CUSTOM, artillery_test: validArtilleryJson } };
            await artilleryValidator.verifyArtillery(req, res, nextStub);
            should(nextStub.calledOnce).eql(true);
        });

        it('The artillery json is not a valid json', async () => {
            let invalidArtilleryJson = {};

            req = { body: { type: consts.TEST_TYPE_CUSTOM, artillery_test: invalidArtilleryJson } };
            await artilleryValidator.verifyArtillery(req, res, nextStub);
            should(nextStub.args[0][0].message).eql('The artillery json is not valid. Errors: Required property \'scenarios\' is missing');
            should(nextStub.args[0][0].statusCode).eql(400);
        });

        it('The request is not a custom test', async () => {
            req = { body: { type: consts.TEST_TYPE_PAYMENTSOS, scenarios: {} } };
            await artilleryValidator.verifyArtillery(req, res, nextStub);
            should(nextStub.calledOnce).eql(true);
        });
    });
});