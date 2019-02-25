'use strict';

const Sequelize = require('sequelize');
let client;

module.exports = {
    init,
    insertReport,
    insertStats,
    updateReport,
    getReport,
    getReports,
    getLastReports,
    getStats
};

async function init(sequlizeClient) {
    client = sequlizeClient;
    await initSchemas();
}

async function insertReport(testId, revisionId, reportId, jobId, testType, startTime, testName, testDescription, testConfiguration, notes) {
    const report = client.model('report');
    const params = {
        test_id: testId,
        job_id: jobId,
        revision_id: revisionId,
        report_type: 'basic',
        test_type: testType,
        test_name: testName,
        test_description: testDescription,
        last_stats: null,
        start_time: startTime,
        end_time: null,
        notes: notes || '',
        phase: '0',
        status: 'initialized',
        test_configuration: testConfiguration
    };

    return report.findOrCreate({ where: { report_id: reportId }, defaults: params });
}

async function insertStats(containerId, testId, reportId, statsId, statsTime, phaseIndex, phaseStatus, data) {
    const stats = client.model('stats');
    const params = {
        container_id: containerId,
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

async function updateReport(testId, reportId, status, phaseIndex, lastStats, endTime) {
    const report = client.model('report');
    const options = {
        where: {
            test_id: testId,
            report_id: reportId
        }
    };

    return report.update({
        status: status,
        phase: phaseIndex,
        last_stats: lastStats,
        end_time: endTime
    }, options);
}

async function getReportsAndParse(query) {
    const report = client.model('report');

    let options = {
        attributes: { exclude: ['updated_at', 'created_at'] }
    };

    Object.assign(options, query);

    const allReportsRawResponse = await report.findAll(options);
    let allReports = allReportsRawResponse.map(rawReport => rawReport.dataValues);

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
        container_id: {
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
        report_type: {
            type: Sequelize.DataTypes.STRING
        },
        test_type: {
            type: Sequelize.DataTypes.STRING
        },
        status: {
            type: Sequelize.DataTypes.STRING
        },
        test_name: {
            type: Sequelize.DataTypes.STRING
        },
        test_description: {
            type: Sequelize.DataTypes.STRING
        },
        last_stats: {
            type: Sequelize.DataTypes.TEXT('long')
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

    await report.sync();
    await stats.sync();
}