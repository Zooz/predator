'use strict';

const uuid = require('uuid/v4');
const _ = require('lodash');
const Sequelize = require('sequelize');

const { JOB_TYPE_FUNCTIONAL_TEST, JOB_TYPE_LOAD_TEST } = require('../../../../common/consts');
const { WEBHOOKS_TABLE_NAME, WEBHOOKS_JOBS_MAPPING_TABLE_NAME } = require('../../../../database/sequlize-handler/consts');

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

async function insertJob(jobId, jobInfo, contextId) {
    const job = client.model('job');
    const params = {
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
        emails: jobInfo.emails ? jobInfo.emails.map(emailAddress => {
            return { id: uuid(), address: emailAddress };
        }) : undefined,
        context_id: contextId
    };

    if (params.type === JOB_TYPE_FUNCTIONAL_TEST) {
        params.arrival_count = jobInfo.arrival_count;
    } else {
        params.arrival_rate = jobInfo.arrival_rate;
        params.ramp_to = jobInfo.ramp_to;
    }

    const include = [];
    if (params.emails) {
        include.push({ association: job.email });
    }
    return client.transaction(async function(transaction) {
        const createdJob = await job.create(params, { include, transaction });
        await createdJob.setWebhooks(jobInfo.webhooks || [], { transaction });
        return createdJob;
    });
}

async function getJobsAndParse(jobId, contextId) {
    const job = client.model('job');

    const options = {
        attributes: { exclude: ['updated_at', 'created_at'] },
        include: [job.email, 'webhooks'],
        where: {}
    };

    if (jobId) {
        options.where.id = jobId;
    }
    if (contextId) {
        options.where.context_id = contextId;
    }
    const allJobsSql = await job.findAll(options);
    const allJobs = allJobsSql.map(sqlJob => sqlJob.dataValues);

    allJobs.forEach(job => {
        job.emails = job.emails && job.emails.length > 0 ? job.emails.map(sqlJob => sqlJob.dataValues.address) : undefined;
        job.webhooks = job.webhooks && job.webhooks.length > 0 ? job.webhooks.map(sqlJob => sqlJob.dataValues.id) : undefined;
    });
    return allJobs;
}

async function getJobs(contextId) {
    const allJobs = await getJobsAndParse(undefined, contextId);
    return allJobs;
}

async function getJob(jobId, contextId) {
    const allJobs = await getJobsAndParse(jobId, contextId);
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
        enabled: jobInfo.enabled,
        notes: jobInfo.notes,
        emails: jobInfo.emails ? jobInfo.emails.map(emailAddress => {
            return { id: uuid(), address: emailAddress };
        }) : undefined
    };
    const oldJob = await job.findByPk(jobId, { include: [job.email] });
    const mergedParams = _.mergeWith(params, oldJob.dataValues, (newValue, oldJobValue) => {
        return newValue !== undefined ? newValue : oldJobValue;
    });

    switch (mergedParams.type) {
        case JOB_TYPE_FUNCTIONAL_TEST: {
            if (!mergedParams.arrival_count) {
                const error = new Error('arrival_count is mandatory when updating job to functional_test');
                error.statusCode = 400;
                throw error;
            }
            mergedParams.arrival_rate = null;
            mergedParams.ramp_to = null;
            break;
        }
        case JOB_TYPE_LOAD_TEST: {
            if (!mergedParams.arrival_rate) {
                const error = new Error('arrival_rate is mandatory when updating job to load_test');
                error.statusCode = 400;
                throw error;
            }
            mergedParams.arrival_count = null;
            break;
        }
        default: {
            const error = new Error(`job type is in an unsupported value: ${mergedParams.type}`);
            error.statusCode = 400;
            throw error;
        }
    }

    const options = {
        where: {
            id: jobId
        }
    };

    delete mergedParams.id;
    const updatedJob = await client.transaction(async function(transaction) {
        await oldJob.setWebhooks(jobInfo.webhooks || [], { transaction });

        const oldEmails = oldJob.emails || [];
        const newEmails = params.emails || [];

        for (let i = 0; i < oldEmails.length > 0; i++) {
            if (!newEmails.find(newEmail => newEmail.address === oldEmails[i].address)) {
                await oldJob.removeEmail(oldEmails[i], { transaction });
            }
        }
        for (let i = 0; i < newEmails.length > 0; i++) {
            if (!oldJob.emails.find(oldEmail => oldEmail.address === newEmails[i].address)) {
                await oldJob.createEmail(newEmails[i], { transaction });
            }
        }

        return job.update(mergedParams, { ...options, transaction });
    });
    return updatedJob;
}

async function deleteJob(jobId, contextId) {
    const job = client.model('job');
    const options = { where: { id: jobId } };
    if (contextId) {
        options.where.context_id = contextId;
    }
    await job.destroy({ where: { id: jobId } });
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
        },
        context_id: {
            type: Sequelize.DataTypes.STRING
        }
    });
    job.email = job.hasMany(email);
    await job.sync();
    await email.sync();

    const webhooks = client.model(WEBHOOKS_TABLE_NAME);
    webhooks.belongsToMany(job, {
        through: WEBHOOKS_JOBS_MAPPING_TABLE_NAME,
        as: 'jobs',
        foreignKey: 'webhook_id'
    });
    job.belongsToMany(webhooks, {
        through: WEBHOOKS_JOBS_MAPPING_TABLE_NAME,
        as: 'webhooks',
        foreignKey: 'job_id'
    });
}
