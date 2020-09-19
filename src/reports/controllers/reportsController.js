
'use strict';
let aggregateReportGenerator = require('../models/aggregateReportGenerator');
let reports = require('../models/reportsManager');
let stats = require('../models/statsManager');

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

module.exports.postStats = async (req, res, next) => {
    try {
        const report = await reports.getReport(req.params.test_id, req.params.report_id);
        await stats.postStats(report, req.body);
    } catch (err) {
        return next(err);
    }
    return res.status(204).json();
};

module.exports.subscribeRunnerToReport = async function(req, res, next) {
    const {
        params: {
            report_id: reportId,
            test_id: testId
        },
        headers: { 'x-runner-id': runnerId }
    } = req;
    try {
        await reports.subscribeRunnerToReport(testId, reportId, runnerId);
        return res.status(204).end();
    } catch (err) {
        return next(err);
    }
};
