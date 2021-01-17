const uuid = require('uuid');
const _ = require('lodash');
const databaseConnector = require('./databaseConnector'),
    notifier = require('./notifier'),
    // kafkaManager = require('../../kafka/manager'),
    reportsManager = require('./reportsManager'),
    constants = require('../utils/constants'),
    testManager = require('../../tests/models/manager'),
    aggregateReportManager = require('./aggregateReportManager'),
    benchmarkCalculator = require('./benchmarkCalculator'),
    configHandler = require('../../configManager/models/configHandler'),
    configConsts = require('../../common/consts').CONFIG,
    reportUtil = require('../utils/reportUtil');

module.exports.postStats = async (report, stats) => {
    const statsParsed = JSON.parse(stats.data);
    const statsTime = statsParsed.timestamp;

    if (stats.phase_status === constants.SUBSCRIBER_DONE_STAGE || stats.phase_status === constants.SUBSCRIBER_ABORTED_STAGE) {
        await databaseConnector.updateSubscriber(report.test_id, report.report_id, stats.runner_id, stats.phase_status);
    } else {
        await updateSubscriberWithStatsInternal(report, stats);
    }

    if (stats.phase_status === constants.SUBSCRIBER_INTERMEDIATE_STAGE || stats.phase_status === constants.SUBSCRIBER_FIRST_INTERMEDIATE_STAGE) {
        await databaseConnector.insertStats(stats.runner_id, report.test_id, report.report_id, uuid(), statsTime, report.phase, stats.phase_status, stats.data);
    }
    await databaseConnector.updateReport(report.test_id, report.report_id, { phase: report.phase, last_updated_at: statsTime });
    report = await reportsManager.getReport(report.test_id, report.report_id);
    const reportBenchmark = await updateReportBenchmarkIfNeeded(report);
    notifier.notifyIfNeeded(report, stats, reportBenchmark);
    // if (reportUtil.isAllRunnersInExpectedPhase(report, constants.SUBSCRIBER_DONE_STAGE)) {
    //     kafkaManager.produce();
    // }
    return stats;
};

async function updateSubscriberWithStatsInternal(report, stats) {
    const parseData = JSON.parse(stats.data);
    const subscriber = report.subscribers.find(subscriber => subscriber.runner_id === stats.runner_id);
    const { last_stats } = subscriber;
    if (last_stats && parseData.rps) {
        const lastTotalCount = _.get(last_stats, 'rps.total_count', 0);
        parseData.rps.total_count = lastTotalCount + parseData.rps.count;
    }
    await databaseConnector.updateSubscriberWithStats(report.test_id, report.report_id, stats.runner_id, stats.phase_status, JSON.stringify(parseData));
}

async function updateReportBenchmarkIfNeeded(report) {
    if (!reportUtil.isAllRunnersInExpectedPhase(report, constants.SUBSCRIBER_DONE_STAGE)) {
        return;
    }
    const config = await configHandler.getConfig();
    const configBenchmark = {
        weights: config[configConsts.BENCHMARK_WEIGHTS],
        threshold: config[configConsts.BENCHMARK_THRESHOLD]
    };
    const testBenchmarkData = await extractBenchmark(report.test_id);
    if (testBenchmarkData) {
        const reportAggregate = await aggregateReportManager.aggregateReport(report);
        const reportBenchmark = benchmarkCalculator.calculate(testBenchmarkData, reportAggregate.aggregate, configBenchmark.weights);
        const { data, score } = reportBenchmark;
        data[configConsts.BENCHMARK_THRESHOLD] = configBenchmark.threshold;
        await databaseConnector.updateReportBenchmark(report.test_id, report.report_id, score, JSON.stringify(data));
        return reportBenchmark;
    }
}

async function extractBenchmark(testId) {
    try {
        const testBenchmarkData = await testManager.getBenchmark(testId);
        return testBenchmarkData;
    } catch (e) {
        return undefined;
    }
}
