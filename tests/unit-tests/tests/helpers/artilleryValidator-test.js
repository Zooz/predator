const sandbox = require('sinon').createSandbox();
const should = require('should');
const artilleryValidator = require('../../../../src/tests/helpers/artilleryValidator');
const consts = require('../../../../src/common/consts');

describe('Artillery validator tests', function () {
    let req, res, resJsonStub, resStatusStub;

    before(() => {
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
            const validArtilleryJson = {
                config: {
                    target: '',
                    http: {
                        pool: 100
                    },
                    phases: [{
                        duration: 0,
                        arrivalRate: 0
                    }]
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

            req = { body: { type: consts.TEST_TYPE_BASIC, artillery_test: validArtilleryJson } };
            should.doesNotThrow(() => artilleryValidator.verifyArtillery(req, res));
        });

        it('The artillery json is not a valid json', () => {
            const invalidArtilleryJson = {};
            req = { body: { type: consts.TEST_TYPE_BASIC, artillery_test: invalidArtilleryJson } };
            (() => artilleryValidator.verifyArtillery(req, res)).should.throw({ statusCode: 400, message: "The artillery json is not valid. Errors: Required property 'scenarios' is missing" });

        });

        it('The request is not a custom test', async () => {
            req = { body: { type: consts.TEST_TYPE_PAYMENTSOS, scenarios: {} } };
            should.doesNotThrow(() => artilleryValidator.verifyArtillery(req, res));
        });
    });
});