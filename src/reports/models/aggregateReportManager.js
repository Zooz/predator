'use strict';

let _ = require('lodash');
let math = require('mathjs');

let logger = require('../../common/logger');
let databaseConnector = require('./databaseConnector');
let constants = require('../utils/constants');

const STATS_INTERVAL = 30;

module.exports = {
    aggregateReport
};

async function aggregateReport(report) {
    let stats = await databaseConnector.getStats(report.test_id, report.report_id);

    if (stats.length === 0) {
        let errorMessage = `Can not generate aggregate report as there are no statistics yet for testId: ${report.test_id} and reportId: ${report.report_id}`;
        logger.error(errorMessage);
        let error = new Error(errorMessage);
        error.statusCode = 404;
        return Promise.reject(error);
    }

    let reportInput = { intermediates: [] };
    reportInput.duration = math.min(report.duration, Math.floor(report.duration_seconds));
    reportInput.start_time = report.start_time;
    reportInput.end_time = report.end_time;
    reportInput.parallelism = report.parallelism;
    reportInput.report_id = report.report_id;
    reportInput.test_id = report.test_id;
    reportInput.test_name = report.test_name;
    reportInput.revision_id = report.revision_id;
    reportInput.score = report.score;
    reportInput.benchmark_weights_data = report.benchmark_weights_data;
    reportInput.notes = report.notes;

    reportInput.status = mapReportStatus(report.status);

    stats = stats.filter(stat => stat.phase_status === constants.SUBSCRIBER_INTERMEDIATE_STAGE || stat.phase_status === constants.SUBSCRIBER_FIRST_INTERMEDIATE_STAGE);
    stats.forEach(stat => {
        let data;
        try {
            data = JSON.parse(stat.data);
            data.bucket = Math.floor((new Date(data.timestamp).getTime() - new Date(report.start_time).getTime()) / 1000 / STATS_INTERVAL) * STATS_INTERVAL;
            reportInput.intermediates.push(data);
        } catch (e) {
            logger.warn(e, 'Received unsupported stats data type while creating report');
        }
    });

    if (report.parallelism > 1) {
        const bucketIntemerdiates = _.groupBy(reportInput.intermediates, 'bucket');
        reportInput.intermediates = _.keysIn(bucketIntemerdiates).map((bucket) => {
            return createAggregateManually(bucketIntemerdiates[bucket]);
        });
    }

    reportInput.aggregate = createAggregateManually(reportInput.intermediates);
    reportInput.aggregate.rps.mean = reportInput.aggregate.rps.mean / reportInput.intermediates.length;
    return reportInput;
}

function createAggregateManually(listOfStats) {
    let requestMedians = [], requestMaxs = [], requestMins = [], scenario95 = [], scenario99 = [], request95 = [],
        request99 = [], scenarioMins = [], scenarioMaxs = [], scenarioMedians = [];
    let result = {
        bucket: 0,
        requestsCompleted: 0,
        scenariosCreated: 0,
        scenariosAvoided: 0,
        scenariosCompleted: 0,
        pendingRequests: 0,
        scenarioCounts: {},
        errors: {},
        concurrency: 0,
        codes: {},
        latency: {
            median: 0,
            max: 0,
            min: 0
        },
        rps: {
            mean: 0,
            count: 0
        },
        scenarioDuration: {}
    };

    _.each(listOfStats, function (stats) {
        result.bucket = stats.bucket;
        result.concurrency += stats.concurrency;

        requestMedians.push(stats.latency.median || 0);
        requestMaxs.push(stats.latency.max || 0);
        requestMins.push(stats.latency.min || 0);
        request95.push((stats.latency.p95 || 0) * stats.requestsCompleted);
        request99.push((stats.latency.p99 || 0) * stats.requestsCompleted);

        scenarioMedians.push(stats.scenarioDuration.median || 0);
        scenarioMaxs.push(stats.scenarioDuration.max || 0);
        scenarioMins.push(stats.scenarioDuration.min || 0);
        scenario95.push((stats.scenarioDuration.p95 || 0) * stats.scenariosCompleted);
        scenario99.push((stats.scenarioDuration.p99 || 0) * stats.scenariosCompleted);

        result.scenariosCreated += stats.scenariosCreated;
        result.scenariosAvoided += stats.scenariosAvoided;
        result.scenariosCompleted += stats.scenariosCompleted;
        result.requestsCompleted += stats.requestsCompleted;
        result.pendingRequests += stats.pendingRequests;

        result.rps.count += stats.rps.count;
        result.rps.mean += stats.rps.mean;

        _.each(stats.assertions, function (assertions, name) {
            if (!result.assertions[name]) {
                result.assertions[name] = {};
            }

            Object.keys(assertions).forEach(assertResultName => {
                if (!result.assertions[name][assertResultName]) {
                    result.assertions[name][assertResultName] = { success: 0, fail: 0, failureResponses: {} };
                }

                result.assertions[name][assertResultName].success += assertions[assertResultName].success;
                result.assertions[name][assertResultName].fail += assertions[assertResultName].fail;

                Object.keys(assertions[assertResultName].failureResponses).forEach((failureResponseName) => {
                    if (!result.assertions[name][assertResultName].failureResponses[failureResponseName]) {
                        result.assertions[name][assertResultName].failureResponses[failureResponseName] = 0;
                    }
                    result.assertions[name][assertResultName].failureResponses[failureResponseName] += assertions[assertResultName].failureResponses[failureResponseName];
                });
            });
        });

        _.each(stats.scenarioCounts, function (count, name) {
            if (result.scenarioCounts[name]) {
                result.scenarioCounts[name] += count;
            } else {
                result.scenarioCounts[name] = count;
            }
        });
        _.each(stats.codes, function (count, code) {
            if (result.codes[code.toString()]) {
                result.codes[code.toString()] += count;
            } else {
                result.codes[code.toString()] = count;
            }
        });
        _.each(stats.errors, function (count, error) {
            if (result.errors[error]) {
                result.errors[error] += count;
            } else {
                result.errors[error] = count;
            }
        });
    });

    result.latency.median = math.median(requestMedians);
    result.latency.min = math.min(requestMins);
    result.latency.max = math.max(requestMaxs);
    result.latency.p95 = math.sum(request95) / result.requestsCompleted;
    result.latency.p99 = math.sum(request99) / result.requestsCompleted;

    result.scenarioDuration.median = math.median(scenarioMedians);
    result.scenarioDuration.min = math.min(scenarioMins);
    result.scenarioDuration.max = math.max(scenarioMaxs);
    result.scenarioDuration.p95 = math.sum(scenario95) / result.scenariosCompleted;
    result.scenarioDuration.p99 = math.sum(scenario99) / result.scenariosCompleted;

    return result;
}

function mapReportStatus(status) {
    const mapper = {
        [constants.REPORT_INITIALIZING_STATUS]: 'Initializing',
        [constants.REPORT_IN_PROGRESS_STATUS]: 'In progress',
        [constants.REPORT_PARTIALLY_FINISHED_STATUS]: 'Partially finished',
        [constants.REPORT_FINISHED_STATUS]: 'Finished',
        [constants.REPORT_ABORTED_STATUS]: 'Aborted',
        [constants.REPORT_FAILED_STATUS]: 'Failed'
    };
    return mapper[status];
}
