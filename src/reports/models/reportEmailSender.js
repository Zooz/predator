'use strict';

const fs = require('fs'),
    path = require('path'),
    _ = require('lodash'),
    nodemailer = require('nodemailer'),
    configHandler = require('../../configManager/models/configHandler'),
    configConsts = require('../../common/consts').CONFIG,
    logger = require('../../common/logger');
module.exports.sendAggregateReport = async (aggregatedResults, job, emails) => {
    let testName = aggregatedResults.test_name;
    let endTime = aggregatedResults.end_time;
    let startTime = aggregatedResults.start_time;
    let testRunTime = timeConversion(endTime - startTime);

    let testInfo = {
        runTime: testRunTime,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        testId: aggregatedResults.test_id,
        revisionId: aggregatedResults.revision_id,
        reportId: aggregatedResults.report_id,
        parallelism: aggregatedResults.parallelism
    };

    let htmlBody = generateReportFromTemplate(testName, testInfo, aggregatedResults.grafana_url, aggregatedResults.aggregate);

    async function createMailOptions(configSmtp) {
        return {
            from: configSmtp.from,
            to: [emails].join(','),
            html: htmlBody,
            subject: `Your test results: ${testName}`
        };
    }

    try {
        let configSmtp = await configHandler.getConfigValue(configConsts.SMTP_SERVER);
        const transporter = await createSMTPClient(configSmtp);
        const mailOptions = createMailOptions(configSmtp);
        let response = await transporter.sendMail(mailOptions);
        transporter.close();
        logger.info(response, `Sent email successfully for testId: ${aggregatedResults.test_id}, reportId: ${aggregatedResults.report_id}`);
    } catch (error) {
        logger.error(error, 'Failed to send email');
    }
};

async function createSMTPClient(configSmtp) {
    var options = {
        port: configSmtp.port,
        host: configSmtp.host,
        connectionTimeout: configSmtp.timeout,
        auth: {
            user: configSmtp.username,
            pass: configSmtp.password
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

function generateReportFromTemplate(testName, testInfo, grafanaUrl, aggregatedResults) {
    let codesSummary = [];
    Object.keys(aggregatedResults.codes).forEach((code) => {
        codesSummary.push(`${code}: ${aggregatedResults.codes[code]}`);
    });
    codesSummary = codesSummary.join(', ');

    let errorsSummary = [];
    Object.keys(aggregatedResults.errors).forEach((error) => {
        errorsSummary.push(`${error}: ${aggregatedResults.errors[error]}`);
    });
    errorsSummary = errorsSummary.join(', ');

    let emailVars = { testName, testInfo, grafanaUrl, aggregatedResults, codesSummary, errorsSummary };

    let templateFn = path.join(
        path.dirname(__filename),
        './templates/email_report.html');
    let template = fs.readFileSync(templateFn, 'utf-8');
    let compiledTemplate = _.template(template);
    let html = compiledTemplate(emailVars);
    return html;
}