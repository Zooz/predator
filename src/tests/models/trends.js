'use strict';
const reportsManager = require('../../reports/models/reportsManager');

module.exports = {
    getTrends
}

async function getTrends(testId, queryParams) {
    const reports = reportsManager.getReports(testId);
    const filteredReports = filterRelevantReports(reports, queryParams)
    const trends = calculateTrends(filteredReports);
    return trends;
}

async function calculateTrends(report) {
    // Todo get reports only in the last X days
    // duration/ arrival_rate
    const reports = await reportsManager.getReports(report.test_id);
    const relevantReports = filterRelevantReports(reports, report.arrival_rate, report.duration);

    const allAggregatedReport = [];

    const promises = relevantReports.map(async report => {
        const aggregatedReport = await aggregateReportManager.aggregateReport((report));
        allAggregatedReport.push(aggregatedReport);
    });

    await Promise.all(promises);

    const trends = [];
    allAggregatedReport.forEach(aggregatedReport => {
        trends.push({
            start_time: aggregatedReport.start_time,
            latency: aggregatedReport.aggregate.latency,
            rps: aggregatedReport.aggregate.rps
        });
    })

    return trends;
}

function filterRelevantReports(reports, queryParams) {
    const { to, from, threshold, arrival_rate: arrivalRate, duration } = queryParams;
    //
    //
    //
    // const minimumDate = new Date();
    // minimumDate.setDate(minimumDate.getDate() - configConsts.TREND_BACK_IN_DAYS);
    //
    // const relevantReports = reports.filter((report) => {
    //     const arrivalRateChange = Math.min(report.arrival_rate, arrivalRate) / Math.max(report.arrival_rate, arrivalRate);
    //     const durationRateChange = Math.min(report.duration, duration) / Math.max(report.duration, duration);
    //     return durationRateChange >= 0.9 && arrivalRateChange >= configConsts.TREND_THRESHOLD && report.start_time >= minimumDate;
    // });
    // return relevantReports;
}