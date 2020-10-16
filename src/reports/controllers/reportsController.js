
'use strict';
const aggregateReportGenerator = require('../models/aggregateReportGenerator');
const reports = require('../models/reportsManager');
const reportExporter = require('../models/reportExporter');
const stats = require('../models/statsManager');
const exportHelper = require('../helpers/exportReportHelper');

module.exports.getAggregateReport = async function (req, res, next) {
    let reportInput;
    try {
        reportInput = await aggregateReportGenerator.createAggregateReport(req.params.test_id, req.params.report_id);
    } catch (err) {
        return next(err);
    }

    return res.send(reportInput);
};

module.exports.getReport = async (req, res, next) => {
    let reportSummary;
    try {
        reportSummary = await reports.getReport(req.params.test_id, req.params.report_id);
    } catch (err) {
        return next(err);
    }

    return res.send(reportSummary);
};

module.exports.editReport = async (req, res, next) => {
    try {
        await reports.editReport(req.params.test_id, req.params.report_id, req.body);
    } catch (err) {
        return next(err);
    }

    return res.status(204).send();
};

module.exports.deleteReport = async (req, res, next) => {
    try {
        await reports.deleteReport(req.params.test_id, req.params.report_id);
    } catch (err) {
        return next(err);
    }
    return res.status(204).send();
};

module.exports.getReports = async (req, res, next) => {
    let reportSummaries;
    try {
        reportSummaries = await reports.getReports(req.params.test_id, req.query.filter);
    } catch (err) {
        return next(err);
    }

    return res.send(reportSummaries);
};

module.exports.getLastReports = async (req, res, next) => {
    let reportSummaries;
    try {
        reportSummaries = await reports.getLastReports(req.query.limit, req.query.filter);
    } catch (err) {
        return next(err);
    }

    return res.send(reportSummaries);
};

module.exports.postReport = async (req, res, next) => {
    let report;
    try {
        report = await reports.postReport(req.params.test_id, req.body);
    } catch (err) {
        return next(err);
    }

    return res.status(201).json(report.report_id);
};

module.exports.postStats = async (req, res, next) => {
    try {
        const report = await reports.getReport(req.params.test_id, req.params.report_id);
        await stats.postStats(report, req.body);
    } catch (err) {
        return next(err);
    }
    return res.status(204).json();
};

module.exports.getExportedReport = async(req, res, next) => {
    let exportedReport;
    let reportInput;
    try{
        reportInput = await aggregateReportGenerator.createAggregateReport(req.params.test_id, req.params.report_id);
        exportedReport = await reportExporter.exportReport(reportInput,req.params.file_format);
    } catch (err){
        return next(err);
    }
    let fileName = exportHelper.getExportedReportName(reportInput,req.params.file_format);
    res.setHeader('Content-disposition', 'attachment; filename='+fileName);
    res.set('Content-Type', exportHelper.getContentType(req.params.file_format));
    return res.send(exportedReport);
}

module.exports.getExportedCompareReport = async(req,res,next) => {
    let exportedCompareReport;
    let aggregateReportArray =[];
    try{
        const {reportIds, testIds} = exportHelper.processCompareReportsInput(req.query);

        for (let index in reportIds){
            let result = await aggregateReportGenerator.createAggregateReport(testIds[index],reportIds[index]);
            aggregateReportArray.push(result);
        }
        exportedCompareReport = await reportExporter.exportCompareReport(aggregateReportArray, req.params.file_format);
    } catch (err) {
        return next(err);
    }

    let fileName = exportHelper.getCompareReportName(aggregateReportArray,req.params.file_format);
    res.setHeader('Content-disposition', 'attachment; filename='+fileName);
    res.set('Content-Type', exportHelper.getContentType(req.params.file_format));
    res.send(exportedCompareReport);
}
