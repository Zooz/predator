'use strict';



let reports = require('./reportsManager');
let aggregateReportManager = require('./aggregateReportManager');


module.exports = {
    createAggregateReport
};

async function createAggregateReport(testId, reportId) {
    const report =  await reports.getReport(testId, reportId);
    const aggregateReport = await aggregateReportManager.aggregateReport(report);
    return aggregateReport;
}

