'use strict';
let should = require('should');
let benchmarkCalculator = require('../../../../src/reports/models/benchmarkCalculator');

describe('benchmark calculator', function () {
    // todo: when implement add real tests
    it('should return right result', function () {
        const res = benchmarkCalculator.calculate({}, {});
        should(res).eql({ data: {}, score: 9 });
    });
});
