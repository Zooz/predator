
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
    } catch (err) {
       res.send(err);
    }

    res.send(reportInput);
}

async function getReport(req, res) {
    let reportSummary;
    try {
        reportSummary = await reports.getReport(req.params.test_id, req.params.report_id);
    } catch (err) {
       res.send(err);
    }

    res.send(reportSummary);
}

async function editReport(req, res) {
    try {
        await reports.editReport(req.params.test_id, req.params.report_id, req.body);
    } catch (err) {
       res.send(err);
    }

    res.code(204).send();
}

async function deleteReport(req, res) {
    try {
        await reports.deleteReport(req.params.test_id, req.params.report_id);
    } catch (err) {
       res.send(err);
    }
    res.code(204).send();
}

async function getReports(req, res) {
    let reportSummaries;
    try {
        reportSummaries = await reports.getReports(req.params.test_id, req.query.filter);
    } catch (err) {
       res.send(err);
    }

    res.send(reportSummaries);
}

async function getLastReports(req, res) {
    let reportSummaries;
    try {
        reportSummaries = await reports.getLastReports(req.query.limit, req.query.filter);
    } catch (err) {
       res.send(err);
    }

    res.send(reportSummaries);
}

async function postReport(req, res) {
    let report;
    try {
        report = await reports.postReportDeprecated(req.params.test_id, req.body);
    } catch (err) {
       res.send(err);
    }
    res.code(201).send(report.report_id);
}

async function postStats(req, res) {
    try {
        const report = await reports.getReport(req.params.test_id, req.params.report_id);
        await stats.postStats(report, req.body);
    } catch (err) {
       res.send(err);
    }
    res.code(204).send();
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
    } catch (err){
       res.send(err);
    }
    const fileName = exportHelper.getExportedReportName(reportInput, req.params.file_format);
    res.setHeader('Content-disposition', 'attachment; filename=' + fileName);
    res.set('Content-Type', exportHelper.getContentType(req.params.file_format));
    res.send(exportedReport);
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
    } catch (err) {
       res.send(err);
    }

    const fileName = exportHelper.getCompareReportName(aggregateReportArray, req.params.file_format);
    res.setHeader('Content-disposition', 'attachment; filename=' + fileName);
    res.set('Content-Type', exportHelper.getContentType(req.params.file_format));
    res.send(exportedCompareReport);
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