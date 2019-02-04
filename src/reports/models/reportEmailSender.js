'use strict';

let fs = require('fs');
let path = require('path');
let _ = require('lodash');
let nodemailer = require('nodemailer');

let smtpConfig = require('../../config/smtpConfig');
let logger = require('../../common/logger');
let reportsManager = require('./reportsManager');
let jobsManager = require('../../jobs/models/jobManager');

module.exports.sendAggregateReport = async (testId, reportId, reportUrl, grafanaUrl) => {
    let report, job;
    try {
        report = await reportsManager.getReport(testId, reportId);
        job = await jobsManager.getJob(report.job_id);
    } catch (error) {
        let errorMessage = `Failed to retrieve summary for testId: ${testId}, reportId: ${reportId}`;
        logger.error(error, errorMessage);
        return Promise.reject(new Error(errorMessage));
    }

    let testName = report.test_name;
    let emails = job.emails;
    let endTime = report.end_time;
    let startTime = report.start_time;
    let testRunTime = timeConversion(endTime - startTime);
    let finalStats = report.last_stats;

    let testInfo = {
        runTime: testRunTime,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        testId: report.test_id,
        revisionId: report.revision_id,
        reportId: report.report_id
    };

    let htmlBody = generateReportFromTemplate(testName, testInfo, grafanaUrl, reportUrl, finalStats);

    const mailOptions = {
        from: 'Performance Framework 💪 <performance@paymentsos.com>',
        to: [emails].join(','),
        html: htmlBody,
        subject: `Your test results: ${testName}`
    };

    try {
        const transporter = createSMTPClient();
        let response = await transporter.sendMail(mailOptions);
        transporter.close();
        logger.info(response, `Send email successfully for testId: ${testId}, reportId: ${reportId}`);
    } catch (error) {
        logger.error(error, 'Failed to send email');
    }
};

function createSMTPClient() {
    var options = {
        port: smtpConfig.port,
        host: smtpConfig.host,
        connectionTimeout: smtpConfig.timeout,
        auth: {
            user: smtpConfig.username,
            pass: smtpConfig.password
        }
    };

    return nodemailer.createTransport(options);
}

function timeConversion(milliseconds) {
    let seconds = (milliseconds / 1000).toFixed(1);

    let minutes = (milliseconds / (1000 * 60)).toFixed(1);

    let hours = (milliseconds / (1000 * 60 * 60)).toFixed(1);

    let days = (milliseconds / (1000 * 60 * 60 * 24)).toFixed(1);

    if (seconds < 60) {
        return seconds + ' Sec';
    } else if (minutes < 60) {
        return minutes + ' Min';
    } else if (hours < 24) {
        return hours + ' Hrs';
    } else {
        return days + ' Days';
    }
}

function generateReportFromTemplate(testName, testInfo, grafanaUrl, reportUrl, finalStats) {
    let codesSummary = [];
    Object.keys(finalStats.codes).forEach((code) => { codesSummary.push(`${code}: ${finalStats.codes[code]}`) });
    codesSummary = codesSummary.join(', ');

    let errorsSummary = [];
    Object.keys(finalStats.errors).forEach((error) => { errorsSummary.push(`${error}: ${finalStats.errors[error]}`) });
    errorsSummary = errorsSummary.join(', ');

    let emailVars = {testName, testInfo, grafanaUrl, reportUrl, finalStats, codesSummary, errorsSummary};

    let templateFn = path.join(
        path.dirname(__filename),
        './templates/email_report.html');
    let template = fs.readFileSync(templateFn, 'utf-8');
    let compiledTemplate = _.template(template);
    let html = compiledTemplate(emailVars);
    return html;
}