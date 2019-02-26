
'use strict';
let artilleryReportGenerator = require('../models/artilleryReportGenerator');
let reports = require('../models/reportsManager');

module.exports.getHtmlReport = async function (req, res, next) {
    let report;
    try {
        report = await artilleryReportGenerator.createArtilleryReport(req.params.test_id, req.params.report_id);
    } catch (err) {
        return next(err);
    }

    return res.send(report);
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

module.exports.getReports = async (req, res, next) => {
    let reportSummaries;
    try {
        reportSummaries = await reports.getReports(req.params.test_id);
    } catch (err) {
        return next(err);
    }

    return res.send(reportSummaries);
};

module.exports.getLastReports = async (req, res, next) => {
    let reportSummaries;
    try {
        reportSummaries = await reports.getLastReports(req.query.limit);
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
        await reports.postStats(req.params.test_id, req.params.report_id, req.body);
    } catch (err) {
        return next(err);
    }
    return res.status(204).json();
};