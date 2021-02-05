
'use strict';
const aggregateReportGenerator = require('../models/aggregateReportGenerator');
const reports = require('../models/reportsManager');
const reportExporter = require('../models/reportExporter');
const stats = require('../models/statsManager');
const exportHelper = require('../helpers/exportReportHelper');

async function getAggregateReport(req, res) {
    let reportInput;
    try {
        reportInput = await aggregateReportGenerator.createAggregateReport(req.params.test_id, req.params.report_id);
        res.send(reportInput);
    } catch (err) {
       res.send(err);
    }
}

async function getReport(req, res) {
    let reportSummary;
    try {
        reportSummary = await reports.getReport(req.params.test_id, req.params.report_id);
        res.send(reportSummary);
    } catch (err) {
       res.send(err);
    }
}

async function editReport(req, res) {
    try {
        await reports.editReport(req.params.test_id, req.params.report_id, req.body);
        res.code(204).send();
    } catch (err) {
       res.send(err);
    }
}

async function deleteReport(req, res) {
    try {
        await reports.deleteReport(req.params.test_id, req.params.report_id);
        res.code(204).send();
    } catch (err) {
       res.send(err);
    }
}

async function getReports(req, res) {
    let reportSummaries;
    try {
        reportSummaries = await reports.getReports(req.params.test_id, req.query.filter);
        res.send(reportSummaries);
    } catch (err) {
       res.send(err);
    }
}

async function getLastReports(req, res) {
    let reportSummaries;
    try {
        reportSummaries = await reports.getLastReports(req.query.limit, req.query.filter);
        res.send(reportSummaries);
    } catch (err) {
       res.send(err);
    }
}

async function postReport(req, res) {
    let report;
    try {
        report = await reports.postReportDeprecated(req.params.test_id, req.body);
        res.code(201).send(report.report_id);
    } catch (err) {
       res.send(err);
    }
}

async function postStats(req, res) {
    try {
        const report = await reports.getReport(req.params.test_id, req.params.report_id);
        await stats.postStats(report, req.body);
        res.code(204).send();
    } catch (err) {
        res.send(err);
    }
}

async function subscribeRunnerToReport(req, res) {
    const {
        params: {
            report_id: reportId,
            test_id: testId
        },
        headers: { 'x-runner-id': runnerId }
    } = req;
    try {
        await reports.subscribeRunnerToReport(testId, reportId, runnerId);
        res.code(204).send();
    } catch (err) {
        res.send(err);
    }
}

async function getExportedReport(req, res) {
    let exportedReport;
    let reportInput;
    try {
        reportInput = await aggregateReportGenerator.createAggregateReport(req.params.test_id, req.params.report_id);
        exportedReport = await reportExporter.exportReport(reportInput, req.params.file_format);
        const fileName = exportHelper.getExportedReportName(reportInput, req.params.file_format);
        res.headers({
            'Content-disposition': `attachment; filename=${fileName}`,
            'Content-Type': `${exportHelper.getContentType(req.params.file_format)}`
        });
        res.send(exportedReport);
    } catch (err){
       res.send(err);
    }
}

async function getExportedCompareReport(req, res) {
    let exportedCompareReport;
    const aggregateReportArray = [];
    try {
        const { reportIds, testIds } = exportHelper.processCompareReportsInput(req.query);

        for (const index in reportIds){
            const result = await aggregateReportGenerator.createAggregateReport(testIds[index], reportIds[index]);
            aggregateReportArray.push(result);
        }
        exportedCompareReport = await reportExporter.exportCompareReport(aggregateReportArray, req.params.file_format);
        const fileName = exportHelper.getCompareReportName(aggregateReportArray, req.params.file_format);
        res.headers({
            'Content-disposition': `attachment; filename=${fileName}`,
            'Content-Type': `${exportHelper.getContentType(req.params.file_format)}`
        });
        res.send(exportedCompareReport);
    } catch (err) {
       res.send(err);
    }
}

module.exports = {
    getAggregateReport,
    getReport,
    editReport,
    deleteReport,
    getReports,
    getLastReports,
    postReport,
    postStats,
    subscribeRunnerToReport,
    getExportedReport,
    getExportedCompareReport
}