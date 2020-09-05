'use strict';

const uuid = require('uuid/v4');
const _ = require('lodash');
const Sequelize = require('sequelize');

const { JOB_TYPE_FUNCTIONAL_TEST, JOB_TYPE_LOAD_TEST } = require('../../../../common/consts');
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
        webhooks: jobInfo.webhooks ? jobInfo.webhooks.map(webhookUrl => { // still missing data attributes(name, global, format_type)
            return { id: uuid(), url: webhookUrl };
        }) : undefined,
        emails: jobInfo.emails ? jobInfo.emails.map(emailAddress => {
            return { id: uuid(), address: emailAddress };
        }) : undefined
    };

    if (params.type === JOB_TYPE_FUNCTIONAL_TEST) {
        params.arrival_count = jobInfo.arrival_count;
    } else {
        params.arrival_rate = jobInfo.arrival_rate;
        params.ramp_to = jobInfo.ramp_to;
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
        include: [job.email, 'webhooks']
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

    const params = {
        test_id: jobInfo.test_id,
        type: jobInfo.type,
        arrival_rate: jobInfo.arrival_rate,
        ramp_to: jobInfo.ramp_to,
        arrival_count: jobInfo.arrival_count,
        cron_expression: jobInfo.cron_expression,
        duration: jobInfo.duration,
        environment: jobInfo.environment,
        parallelism: jobInfo.parallelism,
        max_virtual_users: jobInfo.max_virtual_users,
        proxy_url: jobInfo.proxy_url,
        debug: jobInfo.debug,
        enabled: jobInfo.enabled
    };

    const oldJob = await findJob(jobId);
    if (!oldJob) {
        const error = new Error('Not found');
        error.statusCode = 404;
        throw error;
    }
    const mergedParams = _.mergeWith(params, oldJob, (newValue, oldJobValue) => {
        return newValue !== undefined ? newValue : oldJobValue;
    });

    switch (mergedParams.type) {
    case JOB_TYPE_FUNCTIONAL_TEST:
        if (!mergedParams.arrival_count) {
            const error = new Error('arrival_count is mandatory when updating job to functional_test');
            error.statusCode = 400;
            throw error;
        }
        mergedParams.arrival_rate = null;
        mergedParams.ramp_to = null;
        break;
    case JOB_TYPE_LOAD_TEST:
        if (!mergedParams.arrival_rate) {
            const error = new Error('arrival_rate is mandatory when updating job to load_test');
            error.statusCode = 400;
            throw error;
        }
        mergedParams.arrival_count = null;
        break;
    default:
        const error = new Error(`job type is in an unsupported value: ${mergedParams.type}`);
        error.statusCode = 400;
        throw error;
    }

    let options = {
        where: {
            id: jobId
        }
    };

    delete mergedParams.id;
    let result = await job.update(mergedParams, options);
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
        arrival_count: {
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
    job.email = job.hasMany(email);
    await job.sync();
    await email.sync();

    const webhooks = client.model('webhook');
    webhooks.belongsToMany(job, {
        through: 'webhook_job_mapping',
        as: 'jobs',
        foreignKey: 'webhook_id',
        onDelete: 'CASCADE'
    });
    job.belongsToMany(webhooks, {
        through: 'webhook_job_mapping',
        as: 'webhooks',
        foreignKey: 'job_id'
    });
}

async function findJob(jobId) {
    let jobAsArray = await getJob(jobId);
    return jobAsArray[0];
}