'use strict';
const reportsManager = require('../../reports/models/reportsManager');
const FOURTEEN_DAYS_IN_MS = 12096e5;

module.exports = {
    getTrends
}

async function getTrends(testId, queryParams) {
    const reports = await reportsManager.getReports(testId);
    const filteredReports = filterRelevantReports(reports, queryParams)
    const trends = calculateTrends(filteredReports, queryParams);
    return trends;
}

async function calculateTrends(reports, queryParams) {
    const { shift_comparator: shiftComparator } = queryParams;
    const trends = {
        shift: 0,
        reports: []
    }

    reports.forEach((report) => {
        if (report.results_summary) {
            const reportSummary = {
                report_id: report.report_id,
                job_id: report.job_id,
                start_time: report.start_time,
                results_summary: report.results_summary
            }
            trends.reports.push(reportSummary)
        }
    });

    trends.shift = calculateShift(trends.reports, shiftComparator);

    return trends;
}

function calculateShift(reports, shiftComparator) {
    const mostRecentResult = reports[0].results_summary.latency[shiftComparator];
    const leastRecentResult = reports[reports.length-1].results_summary.latency[shiftComparator];
    const shift = (leastRecentResult - mostRecentResult) / leastRecentResult;
    return shift;
}

function filterRelevantReports(reports, queryParams) {
    const {
        to = Date.now(),
        from = Date.now() - FOURTEEN_DAYS_IN_MS,
        limit,
        min_duration: minDuration,
        max_duration: maxDuration,
        min_rate: minRate,
        max_rate: maxRate,
        min_virtual_users: maxVUsers,
        max_virtual_users: minVUsers
    } = queryParams;

    const fromDate = new Date(from);
    const toDate = new Date(to);

    const relevantReports = reports.filter((report) => {
        const afterFromDate = report.start_time >= fromDate;
        const beforeToDate = report.start_time < toDate;
        const matchesDuration = matchReportProperty(report, 'duration', minDuration, maxDuration);
        const matchesRate = matchReportProperty(report, 'arrival_rate', minRate, maxRate);
        const matchesVUsers = matchReportProperty(report, 'max_virtual_users', minVUsers, maxVUsers);

        return afterFromDate && beforeToDate && matchesDuration && matchesRate && matchesVUsers;
    });

    return relevantReports.slice(0, limit);
}

function matchReportProperty(report, property, min, max) {
    let match;
    if (!min && !max) {
        match = true
    } else if (min && !max) {
        match = report[property] >= min
    } else if (!min && max) {
        match = report[property] < max
    } else {
        match = report[property] >= min && report[property] < max
    }

    return match;
}