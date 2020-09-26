'use strict';

const reports = require('./reportsManager');
const aggregateReportManager = require('./aggregateReportManager');

module.exports = {
    createAggregateReport
};

async function createAggregateReport(testId, reportId) {
    const report = await reports.getReport(testId, reportId);
    const aggregateReport = await aggregateReportManager.aggregateReport(report);
    return aggregateReport;
}
