'use strict';

let fs = require('fs');
let path = require('path');
let _ = require('lodash');

let logger = require('../../common/logger');
let databaseConnector = require('./databaseConnector');

module.exports.createArtilleryReport = async (testId, reportId) => {
    let stats;
    try {
        stats = await databaseConnector.getStats(testId, reportId);
    } catch (error) {
        logger.error(error, 'Failed to get stats from database');
        error.statusCode = 500;
        return Promise.reject(error);
    }

    if (stats.length === 0) {
        let errorMessage = `Can not generate artillery report as testId: ${testId} and reportId: ${reportId} is not found`;
        logger.error(errorMessage);
        let error = new Error(errorMessage);
        error.statusCode = 404;
        return Promise.reject(error);
    }

    let reportInput = { intermediate: [] };
    stats.forEach(stat => {
        switch (stat.phase_status) {
        case 'intermediate':
            reportInput.intermediate.push(JSON.parse(stat.data));
            break;
        case 'aggregate':
            reportInput.aggregate = JSON.parse(stat.data);
            break;
        default:
            logger.warn(stat, 'Received unknown stat from database while creating report');
            break;
        }
    });

    if (!reportInput.aggregate) {
        reportInput.aggregate = createAggregateManually(reportInput.intermediate);
    }

    let reportOutput = generateReportFromTemplate(reportInput);
    return reportOutput;
};

function createAggregateManually(intermediateStats) {
    let result = { requestsCompleted: 0, scenariosCreated: 0, scenariosAvoided: 0, scenariosCompleted: 0, pendingRequests: 0, scenarioCounts: {}, errors: {}, codes: {}, latency: { median: 0, max: 0, min: 9999999 } };
    _.each(intermediateStats, function(stats) {
        result.latency.median += stats.latency.median;
        if (stats.latency.max >= result.latency.max) {
            result.latency.max = stats.latency.max;
        }
        if (stats.latency.min <= result.latency.min) {
            result.latency.min = stats.latency.min;
        }

        result.scenariosCreated += stats.scenariosCreated;
        result.scenariosAvoided += stats.scenariosAvoided;
        _.each(stats.scenarioCounts, function(count, name) {
            if (result.scenarioCounts[name]) {
                result.scenarioCounts[name] += count;
            } else {
                result.scenarioCounts[name] = count;
            }
        });
        result.scenariosCompleted += stats.scenariosCompleted;
        _.each(stats.codes, function(count, code) {
            if (result.codes[code.toString()]) {
                result.codes[code.toString()] += count;
            } else {
                result.codes[code.toString()] = count;
            }
        });
        _.each(stats.errors, function(count, error) {
            if (result.errors[error]) {
                result.errors[error] += count;
            } else {
                result.errors[error] = count;
            }
        });
        result.requestsCompleted += stats.requestsCompleted;

        result.pendingRequests += stats.pendingRequests;
    });

    result.latency.median = result.latency.median / intermediateStats.length;

    return result;
}

function generateReportFromTemplate(reportInput) {
    let templateFn = path.join(
        path.dirname(__filename),
        './templates/index.html.ejs');
    let template = fs.readFileSync(templateFn, 'utf-8');
    let compiledTemplate = _.template(template);
    let html = compiledTemplate({ report: JSON.stringify(reportInput, null, 2) });
    return html;
}