'use strict';

let _ = require('lodash');

module.exports.getStatsFormatted = (stage, report, reportBenchmark = {}) => {
    let beautyReport = '';
    beautyReport += reportBenchmark.score ? `*Score:* ${reportBenchmark.score.toFixed(2)}, ` : '';
    beautyReport += `*RPS sent* ${report.rps.mean}`;
    beautyReport += `, Scenarios launched: ${report.scenariosCreated}`;
    beautyReport += `, Scenarios completed: ${report.scenariosCompleted}`;
    beautyReport += `, Scenarios avoided: ${report.scenariosAvoided}`;
    beautyReport += `, Requests completed: ${report.requestsCompleted}.\n`;

    beautyReport += '*Request latency:*';
    beautyReport += ` min ${report.latency.min}`;
    beautyReport += ` max ${report.latency.max}`;
    beautyReport += `, median ${report.latency.median}`;
    beautyReport += `, p95 ${report.latency.p95}`;
    beautyReport += `, p99 ${report.latency.p99}.\n`;
    beautyReport += '*Scenario duration:*';
    beautyReport += ` min ${report.scenarioDuration.min}`;
    beautyReport += `, max ${report.scenarioDuration.max}`;
    beautyReport += `, median ${report.scenarioDuration.median}`;
    beautyReport += `, p95 ${report.scenarioDuration.p95}`;
    beautyReport += `, p99 ${report.scenarioDuration.p99}.\n`;

    if (_.keys(report.codes).length !== 0) {
        beautyReport += '*Codes:*';
        _.each(report.codes, function (count, code) {
            beautyReport += ` ${code}: ${count}`;
        });
        beautyReport += '.\n';
    }
    if (_.keys(report.errors).length !== 0) {
        beautyReport += '*Errors:*';
        _.each(report.errors, function (count, code) {
            beautyReport += ` ${code}: ${count}`;
        });
        beautyReport += '.\n';
    }
    return beautyReport;
};