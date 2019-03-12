'use strict';

const Sequelize = require('sequelize');

const constants = require('../../../utils/constants');
const logger = require('../../../../common/logger');

let client;

module.exports = {
    init,
    insertReport,
    insertStats,
    updateReport,
    getReport,
    getReports,
    getLastReports,
    getStats,
    subscribeRunner,
    updateSubscribers
};

async function init(sequlizeClient) {
    client = sequlizeClient;
    await initSchemas();
}

async function insertReport(testId, revisionId, reportId, jobId, testType, phase, startTime, testName, testDescription, testConfiguration, notes, lastUpdatedAt) {
    const report = client.model('report');
    const params = {
        test_id: testId,
        job_id: jobId,
        revision_id: revisionId,
        test_type: testType,
        test_name: testName,
        test_description: testDescription,
        last_updated_at: lastUpdatedAt,
        start_time: startTime,
        end_time: null,
        notes: notes || '',
        phase: phase,
        status: constants.REPORT_INITIALIZING_STATUS,
        test_configuration: testConfiguration,
        runners_subscribed: []
    };

    return report.findOrCreate({ where: { report_id: reportId }, defaults: params });
}

async function insertStats(runnerId, testId, reportId, statsId, statsTime, phaseIndex, phaseStatus, data) {
    const stats = client.model('stats');
    const params = {
        runner_id: runnerId,
        report_id: reportId,
        test_id: testId,
        stats_id: statsId,
        stats_time: statsTime,
        phase_index: phaseIndex,
        phase_status: phaseStatus,
        data: data
    };

    return stats.create(params);
}

async function updateReport(testId, reportId, phaseIndex, lastUpdatedAt, endTime) {
    const report = client.model('report');
    const options = {
        where: {
            test_id: testId,
            report_id: reportId
        }
    };

    return report.update({
        phase: phaseIndex,
        last_updated_at: lastUpdatedAt,
        end_time: endTime
    }, options);
}

async function subscribeRunner(testId, reportId, runnerId) {
    const newSubscriber = {
        runner_id: runnerId,
        stage: constants.SUBSCRIBER_INITIALIZING_STAGE
    };

    const report = client.model('report');
    const options = {
        where: {
            test_id: testId,
            report_id: reportId
        }
    };

    let reportToSubscribeRunner = await report.findAll(options);
    reportToSubscribeRunner = reportToSubscribeRunner[0];

    return reportToSubscribeRunner.createSubscriber(newSubscriber);
}

async function updateSubscribers(testId, reportId, runnerId, stage) {
    const reportModel = client.model('report');
    const getReportOptions = {
        where: {
            test_id: testId,
            report_id: reportId
        }
    };

    let report = await reportModel.findAll(getReportOptions);
    report = report[0];

    if (!report) {
        let error = new Error('Report not found');
        error.statusCode = 404;
        throw error;
    }

    try {
        const subscribers = await report.getSubscribers();
        const subscriberToUpdate = await subscribers.find((subscriber) => {
            return subscriber.dataValues.runner_id === runnerId;
        });

        await subscriberToUpdate.set('stage', stage);
        return subscriberToUpdate.save();
    } catch (e) {
        logger.error(e, `Failed to update subscriber ${runnerId} in report ${reportId} for test ${testId}`);
        throw e;
    }
}

async function getReportsAndParse(query) {
    const report = client.model('report');

    let options = {
        attributes: { exclude: ['updated_at', 'created_at'] },
        include: [report.subscriber]
    };

    Object.assign(options, query);

    const allReportsRawResponse = await report.findAll(options);

    let allReports = allReportsRawResponse.map(rawReport => rawReport.dataValues);

    allReports.forEach(report => {
        report.subscribers = report.subscribers.map((sqlJob) => {
            return {
                runner_id: sqlJob.dataValues.runner_id,
                stage: sqlJob.dataValues.stage
            };
        });
    });
    return allReports;
}

async function getLastReports(limit) {
    const lastReports = getReportsAndParse({ limit, order: Sequelize.literal('start_time DESC') });
    return lastReports;
}

async function getReports(testId) {
    const query = { where: { test_id: testId } };
    const allReports = await getReportsAndParse(query);
    return allReports;
}

async function getReport(testId, reportId) {
    const query = { where: { test_id: testId, report_id: reportId } };
    const report = await getReportsAndParse(query);
    return report;
}

async function getStatsAndParse(query) {
    const stats = client.model('stats');

    let options = {
        attributes: { exclude: ['updated_at', 'created_at'] }
    };

    Object.assign(options, query);

    const allStatsRawResponse = await stats.findAll(options);
    const allStats = allStatsRawResponse.map(rawStat => rawStat.dataValues);

    return allStats;
}

async function getStats(testId, reportId) {
    const query = { where: { test_id: testId, report_id: reportId } };
    const stats = await getStatsAndParse(query);
    return stats;
}

async function initSchemas() {
    const stats = client.define('stats', {
        stats_id: {
            type: Sequelize.DataTypes.UUID,
            primaryKey: true
        },
        test_id: {
            type: Sequelize.DataTypes.UUID
        },
        report_id: {
            type: Sequelize.DataTypes.STRING
        },
        runner_id: {
            type: Sequelize.DataTypes.UUID
        },
        stats_time: {
            type: Sequelize.DataTypes.DATE
        },
        phase_status: {
            type: Sequelize.DataTypes.STRING
        },
        phase_index: {
            type: Sequelize.DataTypes.STRING
        },
        data: {
            type: Sequelize.DataTypes.TEXT('long')
        }
    });

    const subscriber = client.define('subscriber', {
        runner_id: {
            type: Sequelize.DataTypes.STRING,
            primaryKey: true
        },
        stage: {
            type: Sequelize.DataTypes.STRING
        }
    });

    const report = client.define('report', {
        report_id: {
            type: Sequelize.DataTypes.STRING,
            primaryKey: true
        },
        test_id: {
            type: Sequelize.DataTypes.UUID
        },
        job_id: {
            type: Sequelize.DataTypes.STRING
        },
        revision_id: {
            type: Sequelize.DataTypes.UUID
        },
        test_type: {
            type: Sequelize.DataTypes.STRING
        },
        test_name: {
            type: Sequelize.DataTypes.STRING
        },
        test_description: {
            type: Sequelize.DataTypes.STRING
        },
        last_updated_at: {
            type: Sequelize.DataTypes.DATE
        },
        start_time: {
            type: Sequelize.DataTypes.DATE
        },
        end_time: {
            type: Sequelize.DataTypes.DATE
        },
        notes: {
            type: Sequelize.DataTypes.STRING
        },
        test_configuration: {
            type: Sequelize.DataTypes.STRING
        },
        phase: {
            type: Sequelize.DataTypes.STRING
        }
    });

    report.subscriber = report.hasMany(subscriber);
    await report.sync();
    await stats.sync();
    await subscriber.sync();
}