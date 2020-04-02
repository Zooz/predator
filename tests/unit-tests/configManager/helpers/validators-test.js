const should = require('should');
const sinon = require('sinon');

const validators = require('../../../../src/configManager/helpers/validators');

describe('configManager validators tests', function() {
    const sandbox = sinon.sandbox.create();
    let nextStub;
    beforeEach(() => {
        nextStub = sandbox.stub();
    });
    afterEach(() => sandbox.restore());

    describe('validate benchmark weights', function() {
        it('should return next with an error when benchmark wegihts not sums up to 100', function() {
            const req = {
                body: {
                    benchmark_weights: {
                        percentile_ninety: { percentage: 10 },
                        percentile_fifty: { percentage: 10 },
                        server_errors: { percentage: 10 },
                        client_errors: { percentage: 10 },
                        rps: { percentage: 10 }
                    }
                }
            };
            const res = {};
            validators.validateBenchmarkWeights(req, res, nextStub);
            should(nextStub.args[0][0].message).eql('Benchmark weights needs to sum up to 100%');
            should(nextStub.args[0][0].statusCode).eql(422);
        });
    });
});
