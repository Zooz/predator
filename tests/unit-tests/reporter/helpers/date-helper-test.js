'use strict';
let sinon = require('sinon');
let should = require('should');
let dateUtil = require('../../../../src/reports/utils/dateUtil');

describe('Date util helper', function () {
    let sandbox, clock;
    const fakeDate = new Date('02/22/2017');
    before(() => {
        sandbox = sinon.sandbox.create();
        clock = sinon.useFakeTimers({ now: fakeDate });
    });

    after(() => {
        sandbox.restore();
        clock.restore();
    });
    it('should return the date same as fakeDate (0 delta)', function () {
        const result = dateUtil.dateXMonthAgo(0);
        should(result.year).eql(fakeDate.getFullYear());
        should(result.month).eql(fakeDate.getMonth() + 1);
    });
    it('should return the date a month ago (1 delta)', function () {
        const result = dateUtil.dateXMonthAgo(1);
        should(result.year).eql(fakeDate.getFullYear());
        should(result.month).eql(fakeDate.getMonth());
    });

    it('should return the date a month ago and the year before january to december', function () {
        const result = dateUtil.dateXMonthAgo(2);
        should(result.year).eql(fakeDate.getFullYear() - 1);
        should(result.month).eql(12);
    });

});
