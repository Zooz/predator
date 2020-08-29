'use strict';

const uuid = require('uuid/v4');
const Sequelize = require('sequelize');

const { JOB_TYPE_LOAD_TEST } = require('../../../../common/consts');
let client;

module.exports = {
    init,
    insertJob,
    getJobs,
    getJob,
    deleteJob,
    updateJob
};

async function init(sequelizeClient) {
    client = sequelizeClient;
    await initSchemas();
}

async function insertJob(jobId, jobInfo) {
    const job = client.model('job');
    let params = {
        id: jobId,
        test_id: jobInfo.test_id,
        type: jobInfo.type,
        cron_expression: jobInfo.cron_expression,
        duration: jobInfo.duration,
        environment: jobInfo.environment,
        parallelism: jobInfo.parallelism,
        max_virtual_users: jobInfo.max_virtual_users,
        notes: jobInfo.notes,
        proxy_url: jobInfo.proxy_url,
        enabled: jobInfo.enabled,
        debug: jobInfo.debug,
        webhooks: jobInfo.webhooks ? jobInfo.webhooks.map(webhookUrl => {
            return { id: uuid(), url: webhookUrl };
        }) : undefined,
        emails: jobInfo.emails ? jobInfo.emails.map(emailAddress => {
            return { id: uuid(), address: emailAddress };
        }) : undefined
    };

    if (params.type === JOB_TYPE_LOAD_TEST) {
        params.arrival_rate = jobInfo.arrival_rate;
        params.ramp_to = jobInfo.ramp_to;
    } else {
        params.arrival_count = jobInfo.arrival_count;
    }

    let include = [];
    if (params.webhooks) {
        include.push({ association: job.webhook });
    }
    if (params.emails) {
        include.push({ association: job.email });
    }
    return job.create(params, { include });
}

async function getJobsAndParse(jobId) {
    const job = client.model('job');

    let options = {
        attributes: { exclude: ['updated_at', 'created_at'] },
        include: [job.webhook, job.email]
    };

    if (jobId) {
        options.where = { id: jobId };
    }
    let allJobsSql = await job.findAll(options);
    let allJobs = allJobsSql.map(sqlJob => sqlJob.dataValues);

    allJobs.forEach(job => {
        job.emails = job.emails && job.emails.length > 0 ? job.emails.map(sqlJob => sqlJob.dataValues.address) : undefined;
        job.webhooks = job.webhooks && job.webhooks.length > 0 ? job.webhooks.map(sqlJob => sqlJob.dataValues.url) : undefined;
    });
    return allJobs;
}

async function getJobs() {
    let allJobs = await getJobsAndParse();
    return allJobs;
}

async function getJob(jobId) {
    let allJobs = await getJobsAndParse(jobId);
    return allJobs;
}

async function updateJob(jobId, jobInfo) {
    const job = client.model('job');

    let params = {
        test_id: jobInfo.test_id,
        arrival_rate: jobInfo.arrival_rate,
        cron_expression: jobInfo.cron_expression,
        duration: jobInfo.duration,
        environment: jobInfo.environment,
        ramp_to: jobInfo.ramp_to,
        parallelism: jobInfo.parallelism,
        max_virtual_users: jobInfo.max_virtual_users,
        proxy_url: jobInfo.proxy_url,
        debug: jobInfo.debug,
        enabled: jobInfo.enabled
    };

    let options = {
        where: {
            id: jobId
        }
    };

    let result = await job.update(params, options);
    return result;
}

async function deleteJob(jobId) {
    const job = client.model('job');
    await job.destroy(
        {
            where: { id: jobId }
        });
}

async function initSchemas() {
    const webhook = client.define('webhook', {
        id: {
            type: Sequelize.DataTypes.UUID,
            primaryKey: true
        },
        url: {
            type: Sequelize.DataTypes.STRING
        }
    });

    const email = client.define('email', {
        id: {
            type: Sequelize.DataTypes.UUID,
            primaryKey: true
        },
        address: {
            type: Sequelize.DataTypes.STRING
        }
    });

    const job = client.define('job', {
        id: {
            type: Sequelize.DataTypes.UUID,
            primaryKey: true
        },
        test_id: {
            type: Sequelize.DataTypes.UUID
        },
        type: {
            type: Sequelize.DataTypes.STRING
        },
        environment: {
            type: Sequelize.DataTypes.STRING
        },
        cron_expression: {
            type: Sequelize.DataTypes.STRING
        },
        arrival_rate: {
            type: Sequelize.DataTypes.INTEGER
        },
        duration: {
            type: Sequelize.DataTypes.INTEGER
        },
        ramp_to: {
            type: Sequelize.DataTypes.INTEGER
        },
        parallelism: {
            type: Sequelize.DataTypes.INTEGER
        },
        max_virtual_users: {
            type: Sequelize.DataTypes.INTEGER
        },
        notes: {
            type: Sequelize.DataTypes.STRING
        },
        proxy_url: {
            type: Sequelize.DataTypes.STRING
        },
        debug: {
            type: Sequelize.DataTypes.STRING
        },
        enabled: {
            type: Sequelize.DataTypes.BOOLEAN
        }
    });

    job.webhook = job.hasMany(webhook);
    job.email = job.hasMany(email);
    await job.sync();
    await webhook.sync();
    await email.sync();
}