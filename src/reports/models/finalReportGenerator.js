'use strict';

let fs = require('fs');
let path = require('path');
let _ = require('lodash');
let math = require('mathjs');

let logger = require('../../common/logger');
let databaseConnector = require('./databaseConnector');
let reportsManager = require('./reportsManager');
let constants = require('../utils/constants');

const STATS_INTERVAL = 30;

module.exports.createFinalReport = async (testId, reportId) => {
    let stats, report;
    report = await reportsManager.getReport(testId, reportId);
    stats = await databaseConnector.getStats(testId, reportId);

    if (stats.length === 0) {
        let errorMessage = `Can not generate artillery report as testId: ${testId} and reportId: ${reportId} is not found`;
        logger.error(errorMessage);
        let error = new Error(errorMessage);
        error.statusCode = 404;
        return Promise.reject(error);
    }

    let reportInput = { intermediate: [], final_report: [] };
    reportInput.duration = math.min(report.duration, Math.floor(report.duration_seconds));
    reportInput.start_time = report.start_time;
    reportInput.parallelism = report.parallelism;
    reportInput.status = mapReportStatus(report.status);

    stats.forEach(stat => {
        let data;
        try {
            data = JSON.parse(stat.data);
            data.bucket = Math.floor((new Date(data.timestamp).getTime() - new Date(report.start_time).getTime()) / 1000 / STATS_INTERVAL) * STATS_INTERVAL;
            switch (stat.phase_status) {
            case 'intermediate':
                reportInput.intermediate.push(data);
                break;
            case 'final_report':
                reportInput.final_report.push(data);
                break;
            default:
                logger.warn(stat, 'Received unknown stat from database while creating report');
                break;
            }
        } catch (e) {
            logger.warn(e, 'Received unsupported stats data type while creating report');
        }
    });

    if (report.parallelism > 1) {
        const bucketIntemerdiates = _.groupBy(reportInput.intermediate, 'bucket');
        reportInput.intermediate = _.keysIn(bucketIntemerdiates).map((bucket) => {
            return createAggregateManually(bucketIntemerdiates[bucket]);
        });
    }

    if (_.isEmpty(reportInput.final_report)) {
        reportInput.aggregate = createAggregateManually(reportInput.intermediate);
    } else {
        reportInput.aggregate = createAggregateManually(reportInput.final_report);
    }

    return reportInput;
};

module.exports.generateReportFromTemplate = (reportInput) => {
    let templateFn = path.join(
        path.dirname(__filename),
        './templates/index.html.ejs');
    let template = fs.readFileSync(templateFn, 'utf-8');
    let compiledTemplate = _.template(template);
    let html = compiledTemplate({ report: JSON.stringify(reportInput, null, 2) });
    return html;
};

function createAggregateManually(listOfStats) {
    let medians = [], maxs = [], mins = [], scenario95 = [], scenario99 = [], request95 = [], request99 = [];
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
        scenarioDuration: { }
    };
    _.each(listOfStats, function(stats) {
        result.bucket = stats.bucket;
        result.concurrency += stats.concurrency;

        medians.push(stats.latency.median);
        maxs.push(stats.latency.max);
        mins.push(stats.latency.min);
        request95.push(stats.latency.p95 * stats.requestsCompleted);
        request99.push(stats.latency.p99 * stats.requestsCompleted);
        scenario95.push(stats.scenarioDuration.p95 * stats.scenariosCompleted);
        scenario99.push(stats.scenarioDuration.p99 * stats.scenariosCompleted);

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

        result.rps.count += stats.rps.count;
        result.requestsCompleted += stats.requestsCompleted;

        result.pendingRequests += stats.pendingRequests;
    });

    result.rps.mean = result.rps.count / STATS_INTERVAL;
    result.latency.median = math.median(medians);
    result.latency.min = math.min(mins);
    result.latency.max = math.max(maxs);
    result.latency.p95 = math.sum(request95) / result.requestsCompleted;
    result.latency.p99 = math.sum(request99) / result.requestsCompleted;

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