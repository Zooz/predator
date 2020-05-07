'use strict';
let should = require('should');
let benchmarkCalculator = require('../../../../src/reports/models/benchmarkCalculator');
const benchmarkBasic = {
    'rps': {
        'count': 200,
        'mean': 200
    },
    'errors': {
        'test': 50
    },
    'codes': {
        200: 50,
        501: 25,
        503: 25
    },
    'latency': {
        'p95': 200,
        'median': 300
    }
};

const configBasic =
    {
        'percentile_ninety_five': {
            'percentage': 20
        },
        'percentile_fifty': {
            'percentage': 20
        },
        'server_errors_ratio': {
            'percentage': 20
        },
        'client_errors_ratio': {
            'percentage': 20
        },
        'rps': {
            'percentage': 20
        }
    };

const emptyCofnig =
    {
        'percentile_ninety_five': {
            'percentage': 0
        },
        'percentile_fifty': {
            'percentage': 0
        },
        'server_errors_ratio': {
            'percentage': 0
        },
        'client_errors_ratio': {
            'percentage': 0
        },
        'rps': {
            'percentage': 0
        }
    };

const reportResult = {
    'bucket': 60,
    'requestsCompleted': 118,
    'scenariosCreated': 60,
    'scenariosAvoided': 0,
    'scenariosCompleted': 59,
    'pendingRequests': 1,
    'scenarioCounts': {
        'Scenario 1': 60
    },
    'errors': {
        'test': 100
    },
    'concurrency': 1,
    'codes': {
        '200': 59,
        '301': 59,
        '404': 50,
        '501': 50,
        '503': 50
    },
    'latency': {
        'median': 206,
        'max': 591,
        'min': 152,
        'p95': 248,
        'p99': 410
    },
    'rps': {
        'mean': 200,
        'count': 200
    },
    'scenarioDuration': {
        'median': 498,
        'min': 427.5,
        'max': 836.7,
        'p95': 548,
        'p99': 709
    }
};

const benchmark = (override) => {
    return Object.assign({}, benchmarkBasic, override);
};

const config = (override) => {
    return Object.assign({}, emptyCofnig, override);
};

const report = (override) => {
    return Object.assign({}, reportResult, override);
};

describe('benchmark calculator', function () {
    it('should return score 100 when benchmark and report are exactly the same', () => {
        const res = benchmarkCalculator.calculate(benchmarkBasic, benchmarkBasic, configBasic);
        should(res.score).eql(100);
        should(res.data).eql({
            'rps': {
                'benchmark_value': 200,
                'report_value': 200,
                'percentage': 0.2,
                'score': 20
            },
            'percentile_ninety_five': {
                'benchmark_value': 200,
                'report_value': 200,
                'percentage': 0.2,
                'score': 20
            },
            'percentile_fifty': {
                'benchmark_value': 300,
                'report_value': 300,
                'percentage': 0.2,
                'score': 20
            },
            'client_errors_ratio': {
                'benchmark_value': 0,
                'report_value': 0,
                'percentage': 0.2,
                'score': 20
            },
            'server_errors_ratio': {
                'benchmark_value': 0.5,
                'report_value': 0.5,
                'percentage': 0.2,
                'score': 20
            }
        });
    });
    it('should return score of 50 when error code are double and 100% of score', () => {
        const configOnlyErrors = config({
            'server_errors_ratio': {
                'percentage': 100
            }
        });
        const res = benchmarkCalculator.calculate(benchmarkBasic, reportResult, configOnlyErrors);
        should(res.score).eql(50);
        should(res.data.server_errors_ratio).eql({
            'benchmark_value': 0.5,
            'report_value': 1,
            'percentage': 1,
            'score': 50
        });
    });
    it('should return score of 50 when client code are double and 100% of score', () => {
        const configOnlyErrors = config({
            'client_errors_ratio': {
                'percentage': 100
            }
        });
        const benchmarkClientError = benchmark({
            'codes': {
                '400': 60
            }
        });
        const reportClientError = report({
            'codes': {
                '400': 120
            }
        });

        const res = benchmarkCalculator.calculate(benchmarkClientError, reportClientError, configOnlyErrors);
        should(res.score).eql(50);
        should(res.data.client_errors_ratio).eql({
            'benchmark_value': 0.3,
            'percentage': 1,
            'report_value': 0.6,
            'score': 50
        });
    });
    it('should return score of 50 when  half of the request fail, and benchmark errors is zero', () => {
        const configOnlyErrors = config({
            'client_errors_ratio': {
                'percentage': 100
            }
        });
        const benchmarkClientError = benchmark({
            'codes': {
                '400': 0
            }
        });
        const reportClientError = report({
            'codes': {
                '400': 100
            }
        });

        const res = benchmarkCalculator.calculate(benchmarkClientError, reportClientError, configOnlyErrors);
        should(res.score).eql(50);
        should(res.data.client_errors_ratio).eql({
            'benchmark_value': 0,
            'percentage': 1,
            'report_value': 0.5,
            'score': 50
        });
    });
    it('should return score of 100 when rps is more the benchmark with 100%', () => {
        const configOnlyErrors = config({
            'rps': {
                'percentage': 100
            }
        });
        const benchmarkClientError = benchmark({
            'rps': {
                'count': 200,
                'mean': 100
            }
        });

        const res = benchmarkCalculator.calculate(benchmarkClientError, reportResult, configOnlyErrors);
        should(res.score).eql(100);
        should(res.data.rps).eql({
            'benchmark_value': 100,
            'report_value': 200,
            'percentage': 1,
            'score': 100
        });
    });

    it('should return score of 50 when rps is half of the benchmark with 100%', () => {
        const configOnlyErrors = config({
            'rps': {
                'percentage': 100
            }
        });
        const benchmarkClientError = benchmark({
            'rps': {
                'mean': 400
            }
        });

        const res = benchmarkCalculator.calculate(benchmarkClientError, reportResult, configOnlyErrors);
        should(res.score).eql(50);
        should(res.data.rps).eql({
            'benchmark_value': 400,
            'report_value': 200,
            'percentage': 1,
            'score': 50
        });
    });
});
