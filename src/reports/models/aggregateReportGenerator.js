'use strict';

const reports = require('./reportsManager');
const aggregateReportManager = require('./aggregateReportManager');

module.exports = {
    createAggregateReport
};

async function createAggregateReport(testId, reportId) {
    const report = await reports.getReport(testId, reportId);
    return await aggregateReportManager.aggregateReport(report);
}
