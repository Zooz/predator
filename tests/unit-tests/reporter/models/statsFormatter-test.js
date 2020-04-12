'use strict';
let sinon = require('sinon');
let should = require('should');
let statsFormatter = require('../../../../src/reports/models/statsFormatter');

const REPORT = {
    'timestamp': '2018-05-15T14:20:02.109Z',
    'scenariosCreated': 96,
    'scenariosCompleted': 92,
    'requestsCompleted': 185,
    'scenariosAvoided': 50,
    'latency': {
        'min': 167.6,
        'max': 667.5,
        'median': 193.8,
        'p95': 322.4,
        'p99': 609.6
    },
    'rps': {
        'count': 189,
        'mean': 19.15
    },
    'scenarioDuration': {
        'min': 367.7,
        'max': 1115.1,
        'median': 385.1,
        'p95': 780.8,
        'p99': 1060.9
    },
    'scenarioCounts': {
        'Scenario': 96
    },
    'errors': {
        'Server Error': 10
    },
    'codes': {
        '201': 185
    },
    'matches': 0,
    'customStats': {},
    'concurrency': 4,
    'pendingRequests': 4
};
describe('Stats formatter test', () => {
    let sandbox;
    before(() => {
        sandbox = sinon.createSandbox();
    });

    beforeEach(() => {
        sandbox.resetHistory();
    });

    after(() => {
        sandbox.restore();
    });

    it('Test successful format', () => {
        let statsFormatted = statsFormatter.getStatsFormatted('summary', REPORT);
        statsFormatted.should.eql('*RPS sent* 19.15, Scenarios launched: 96, Scenarios completed: 92, Scenarios avoided: 50, Requests completed: 185.\n' +
            '*Request latency:* min 167.6 max 667.5, median 193.8, p95 322.4, p99 609.6.\n' +
            '*Scenario duration:* min 367.7, max 1115.1, median 385.1, p95 780.8, p99 1060.9.\n' +
            '*Codes:* 201: 185.\n' +
            '*Errors:* Server Error: 10.\n');
    });
    it('Test successful format with benchmark', () => {
        let statsFormatted = statsFormatter.getStatsFormatted('summary', REPORT, { score: 99.6234 });
        statsFormatted.should.eql('*Score:* 99.62, *RPS sent* 19.15, Scenarios launched: 96, Scenarios completed: 92, Scenarios avoided: 50, Requests completed: 185.\n' +
            '*Request latency:* min 167.6 max 667.5, median 193.8, p95 322.4, p99 609.6.\n' +
            '*Scenario duration:* min 367.7, max 1115.1, median 385.1, p95 780.8, p99 1060.9.\n' +
            '*Codes:* 201: 185.\n' +
            '*Errors:* Server Error: 10.\n');
    });
});