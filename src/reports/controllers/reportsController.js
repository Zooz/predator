
'use strict';
const aggregateReportGenerator = require('../models/aggregateReportGenerator');
const reports = require('../models/reportsManager');
const stats = require('../models/statsManager');
const { re } = require('mathjs');
const { aggregateReport } = require('../models/aggregateReportManager');

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
    try{
        let reportInput;
        try {
            reportInput = await aggregateReportGenerator.createAggregateReport(req.params.test_id, req.params.report_id);
        } catch (err) {
            return next(err);
        }
        exportedReport = await reports.exportReport(reportInput,req.params.file_format);
    } catch (err){
        return next(err);
    }
    return res.send(exportedReport);
}

module.exports.getExportedCompareReport = async(req,res,next) => {
    let exportedCompareReport;
    try{
        let aggregateReportArray =[];
        let reportIds = req.query['reportIds'].split(",");
        let testIds = req.query['testIds'].split(",");
        for (let index in reportIds){
            try {
                let result = await aggregateReportGenerator.createAggregateReport(testIds[index],reportIds[index]);
                aggregateReportArray.push(result);
            } catch (err){
                return next(err);
            }
        }
        exportedCompareReport = await reports.exportCompareReport(aggregateReportArray, req.params.file_format);
    } catch (err) {
        return next(err);
    }
    return res.send(exportedCompareReport);
}