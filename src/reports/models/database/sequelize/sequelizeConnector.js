'use strict';

const Sequelize = require('sequelize');
const uuid = require('uuid');

const constants = require('../../../utils/constants');

let client;

module.exports = {
    init,
    insertReport,
    insertStats,
    updateReport,
    deleteReport,
    getReport,
    getReports,
    getLastReports,
    getStats,
    subscribeRunner,
    updateSubscriberWithStats,
    updateSubscriber,
    updateReportBenchmark
};

async function init(sequlizeClient) {
    client = sequlizeClient;
    await initSchemas();
}

async function insertReport(testId, revisionId, reportId, jobId, testType, phase, startTime, testName, testDescription, testConfiguration, notes, lastUpdatedAt, isFavorite) {
    const report = client.model('report');
    const params = {
        report_id: uuid.v4(),
        test_id: testId,
        job_id: jobId,
        revision_id: revisionId,
        test_type: testType,
        test_name: testName,
        test_description: testDescription,
        last_updated_at: lastUpdatedAt,
        start_time: startTime,
        notes: notes || '',
        phase: phase,
        test_configuration: testConfiguration,
        runners_subscribed: [],
        is_favorite: isFavorite
    };
    return report.create(params);
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

async function updateReport(testId, reportId, reportData) {
    const report = client.model('report');
    const options = {
        where: {
            test_id: testId,
            report_id: reportId
        }
    };

    return report.update(reportData, options);
}

async function deleteReport(testId, reportId) {
    const reportModel = client.model('report');
    const getReportOptions = {
        where: {
            test_id: testId,
            report_id: reportId
        }
    };
    let report = await reportModel.findAll(getReportOptions);
    report = report[0];
    const subscribers = await report.getSubscribers();
    let subscriberRunnerIds;
    if (subscribers) {
        subscriberRunnerIds = subscribers.map(subscriber => subscriber.runner_id);
    }

    const deleteStatsAndReportOptions = {
        where: {
            test_id: testId,
            report_id: reportId
        }
    };

    await reportModel.destroy(deleteStatsAndReportOptions);
    const statsModel = client.model('stats');
    await statsModel.destroy(deleteStatsAndReportOptions);

    if (subscriberRunnerIds && subscriberRunnerIds.length > 0) {
        const deleteSubscribersOptions = {
            where: {
                runner_id: subscriberRunnerIds
            }
        };
        const subscribersModel = client.model('subscriber');
        await subscribersModel.destroy(deleteSubscribersOptions);
    }
}

async function updateReportBenchmark(testId, reportId, score, benchmarkData) {
    const benchmark = client.model('report');
    const params = { score: score, benchmark_weights_data: benchmarkData };
    const options = {
        where: {
            test_id: testId,
            report_id: reportId
        }
    };
    const res = await benchmark.update(params, options);
    return res;
}

async function subscribeRunner(testId, reportId, runnerId) {
    const newSubscriber = {
        runner_id: runnerId,
        phase_status: constants.SUBSCRIBER_INITIALIZING_STAGE
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

async function updateSubscriberWithStats(testId, reportId, runnerId, phaseStatus, lastStats) {
    const subscriberToUpdate = await getSubscriber(testId, reportId, runnerId);

    await subscriberToUpdate.set({ phase_status: phaseStatus, last_stats: lastStats });
    return subscriberToUpdate.save();
}

async function updateSubscriber(testId, reportId, runnerId, phaseStatus) {
    const subscriberToUpdate = await getSubscriber(testId, reportId, runnerId);

    await subscriberToUpdate.set({ phase_status: phaseStatus });
    return subscriberToUpdate.save();
}

async function getReportsAndParse(query) {
    const report = client.model('report');

    const options = {
        attributes: { exclude: ['updated_at', 'created_at'] },
        include: [report.subscriber]
    };

    Object.assign(options, query);

    const allReportsRawResponse = await report.findAll(options);

    const allReports = allReportsRawResponse.map(rawReport => rawReport.dataValues);

    allReports.forEach(report => {
        report.subscribers = report.subscribers.map((sqlJob) => {
            return {
                runner_id: sqlJob.dataValues.runner_id,
                phase_status: sqlJob.dataValues.phase_status,
                last_stats: JSON.parse(sqlJob.dataValues.last_stats)
            };
        });
    });
    return allReports;
}

async function getLastReports(limit, filter) {
    const queryOptions = { limit, order: [['start_time', 'DESC']] };
    if (filter) {
        queryOptions.where = {};
        queryOptions.where[filter] = true;
    }
    const lastReports = await getReportsAndParse(queryOptions);
    return lastReports;
}

async function getReports(testId, filter) {
    const queryOptions = { where: { test_id: testId }, order: [['start_time', 'DESC']] };
    if (filter) {
        queryOptions.where[filter] = true;
    }

    const allReports = await getReportsAndParse(queryOptions);
    return allReports;
}

async function getReport(testId, reportId) {
    const query = { where: { test_id: testId, report_id: reportId } };
    const report = await getReportsAndParse(query);
    return report;
}

async function getStatsAndParse(query) {
    const stats = client.model('stats');

    const options = {
        attributes: { exclude: ['updated_at', 'created_at'] },
        order: [
            ['stats_time', 'ASC']
        ]
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
            type: Sequelize.DataTypes.STRING
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
        phase_status: {
            type: Sequelize.DataTypes.STRING
        },
        last_stats: {
            type: Sequelize.DataTypes.TEXT('long')
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
        notes: {
            type: Sequelize.DataTypes.STRING
        },
        test_configuration: {
            type: Sequelize.DataTypes.STRING
        },
        phase: {
            type: Sequelize.DataTypes.STRING
        },
        benchmark_weights_data: {
            type: Sequelize.DataTypes.TEXT('long')
        },
        score: {
            type: Sequelize.DataTypes.FLOAT
        },
        is_favorite: {
            type: Sequelize.DataTypes.BOOLEAN
        }
    });

    report.subscriber = report.hasMany(subscriber);
    await report.sync();
    await stats.sync();
    await subscriber.sync();
}

async function getSubscriber(testId, reportId, runnerId) {
    const reportModel = client.model('report');
    const getReportOptions = {
        where: {
            test_id: testId,
            report_id: reportId
        }
    };
    let report = await reportModel.findAll(getReportOptions);
    report = report[0];

    const subscribers = await report.getSubscribers();
    const subscriberToUpdate = await subscribers.find((subscriber) => {
        return subscriber.dataValues.runner_id === runnerId;
    });
    return subscriberToUpdate;
}
