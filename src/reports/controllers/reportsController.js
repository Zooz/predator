
'use strict';
let artilleryReportGenerator = require('../models/artilleryReportGenerator');
let reports = require('../models/reportsManager');

module.exports.getHtmlReport = async function (req, res) {
    let report;
    try {
        report = await artilleryReportGenerator.createArtilleryReport(req.params.test_id, req.params.report_id);
    } catch (error) {
        return res.status(error.statusCode).json({ message: error.message });
    }

    return res.send(report);
};

module.exports.getReport = async (req, res) => {
    let reportSummary;
    try {
        reportSummary = await reports.getReport(req.params.test_id, req.params.report_id);
    } catch (error) {
        return res.status(error.statusCode).json({ message: error.message });
    }

    return res.send(reportSummary);
};

module.exports.getReports = async (req, res) => {
    let reportSummaries;
    try {
        reportSummaries = await reports.getReports(req.params.test_id);
    } catch (error) {
        return res.status(error.statusCode).json({ message: error.message });
    }

    return res.send(reportSummaries);
};

module.exports.getLastReports = async (req, res) => {
    let reportSummaries;
    try {
        reportSummaries = await reports.getLastReports(req.query.limit);
    } catch (error) {
        return res.status(error.statusCode).json({ message: error.message });
    }

    return res.send(reportSummaries);
};

module.exports.postReport = async (req, res) => {
    let report;
    try {
        report = await reports.postReport(req.params.test_id, req.body);
    } catch (error) {
        return res.status(error.statusCode).json({ message: error.message });
    }

    return res.status(201).json(report.id);
};

module.exports.postStats = async (req, res) => {
    try {
        await reports.postStats(req.params.test_id, req.params.report_id, req.body);
    } catch (error) {
        return res.status(error.statusCode).json({ message: error.message });
    }
    return res.status(204).json();
};