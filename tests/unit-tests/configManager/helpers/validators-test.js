const validators = require('../../../../src/configManager/helpers/validators');
const should = require('should');

describe('configManager validators tests', function() {
    describe('validate benchmark weights', function() {
        it('should throw an error when benchmark wegihts not sums up to 100', function() {
            try {
                const config = {
                    benchmark_config: {
                        benchmark_weights: {
                            percentile_ninety: { percentage: 10 },
                            percentile_fifty: { percentage: 10 },
                            server_errors: { percentage: 10 },
                            client_errors: { percentage: 10 },
                            rps: { percentage: 10 }
                        }
                    }
                };
                validators.validateBenchmarkWeights(config);
                return Promise.reject('expected to reject');
            } catch (err){
                should(err.message).eql('Benchmark weights needs to sum up to 100%');
                should(err.statusCode).eql(422);
            }
        });
    });
});
