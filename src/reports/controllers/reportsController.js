
'use strict';
const aggregateReportGenerator = require('../models/aggregateReportGenerator');
const reports = require('../models/reportsManager');
const reportExporter = require('../models/reportExporter');
const stats = require('../models/statsManager');
const exportHelper = require('../helpers/exportReportHelper');

module.exports.getAggregateReport = async function (req, res) {
    let reportInput;
    try {
        reportInput = await aggregateReportGenerator.createAggregateReport(req.params.test_id, req.params.report_id);
    } catch (err) {
       res.send(err);
    }

    res.send(reportInput);
};

module.exports.getReport = async (req, res) => {
    let reportSummary;
    try {
        reportSummary = await reports.getReport(req.params.test_id, req.params.report_id, req.requestContext);
    } catch (err) {
       res.send(err);
    }

    res.send(reportSummary);
};

module.exports.editReport = async (req, res) => {
    try {
        await reports.editReport(req.params.test_id, req.params.report_id, req.body, req.requestContext);
    } catch (err) {
       res.send(err);
    }

    res.code(204).send();
};

module.exports.deleteReport = async (req, res) => {
    try {
        await reports.deleteReport(req.params.test_id, req.params.report_id, req.requestContext);
    } catch (err) {
       res.send(err);
    }
    res.code(204).send();
};

module.exports.getReports = async (req, res) => {
    let reportSummaries;
    try {
        reportSummaries = await reports.getReports(req.params.test_id, req.query.filter, req.requestContext);
    } catch (err) {
       res.send(err);
    }

    res.send(reportSummaries);
};

module.exports.getLastReports = async (req, res) => {
    let reportSummaries;
    try {
        reportSummaries = await reports.getLastReports(req.query.limit, req.query.filter, req.requestContext);
    } catch (err) {
       res.send(err);
    }

    res.send(reportSummaries);
};

module.exports.postReport = async (req, res) => {
    let report;
    try {
        report = await reports.postReportDeprecated(req.params.test_id, req.body);
    } catch (err) {
       res.send(err);
    }
    res.code(201).send(report.report_id);
};

module.exports.postStats = async (req, res) => {
    try {
        const report = await reports.getReport(req.params.test_id, req.params.report_id, req.requestContext);
        await stats.postStats(report, req.body);
    } catch (err) {
       res.send(err);
    }
    res.code(204).send();
};

module.exports.subscribeRunnerToReport = async function(req, res) {
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
};

module.exports.getExportedReport = async(req, res) => {
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
};

module.exports.getExportedCompareReport = async(req, res) => {
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
};
