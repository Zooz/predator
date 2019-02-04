let logger = require('../../../../common/logger');
let databaseConfig = require('../../../../config/databaseConfig');
let client;

const INSERT_JOB = 'INSERT INTO jobs(id, test_id, arrival_rate, cron_expression, duration, emails, environment, ramp_to, webhooks) values(?,?,?,?,?,?,?,?,?)';
const GET_JOBS = 'SELECT * FROM jobs';
const DELETE_JOB = 'DELETE FROM jobs WHERE id=?';
const GET_JOB = 'SELECT * FROM jobs WHERE id=?';
const GET_COLUMNS = 'SELECT * FROM system_schema.columns WHERE keyspace_name = ? AND table_name = \'jobs\'';

let columns;

module.exports = {
    init,
    insertJob,
    getJobs,
    getJob,
    deleteJob,
    updateJob
};

let queryOptions = {
    consistency: databaseConfig.cassandraConsistency,
    prepare: true
};

async function init(cassandraClient) {
    client = cassandraClient;
}

function deleteJob(jobId) {
    return executeQuery(DELETE_JOB, [jobId]);
}

function getJobs() {
    return executeQuery(GET_JOBS, []);
}

function getJob(jobId) {
    return executeQuery(GET_JOB, [jobId]);
}

function insertJob(jobId, jobInfo) {
    let params = [jobId, jobInfo.test_id, jobInfo.arrival_rate, jobInfo.cron_expression, jobInfo.duration, jobInfo.emails, jobInfo.environment, jobInfo.ramp_to, jobInfo.webhooks];
    return executeQuery(INSERT_JOB, params, queryOptions);
}

async function updateJob(jobId, jobInfo) {
    let params = [];
    let updateQuery = 'UPDATE jobs SET ';

    if (!columns) {
        columns = await getColumns();
    }

    let error;

    Object.keys(jobInfo).forEach(function (key) {
        if (!(columns.indexOf(key) <= -1)) {
            updateQuery += key + '=?, ';
            params.push(jobInfo[key]);
        }
    });

    if (error) {
        return Promise.reject(error);
    }

    if (params.length > 0) {
        updateQuery = updateQuery.substring(0, updateQuery.length - 2);
        updateQuery += ' WHERE id=? IF EXISTS';
        params.push(jobId);
        return executeQuery(updateQuery, params);
    }
}

async function getColumns() {
    let getColumnsResponse = await executeQuery(GET_COLUMNS, [databaseConfig.name]);
    let columns = getColumnsResponse.map(row => {
        return row.column_name;
    });
    columns = columns.filter(column => !(columns === 'job_id' || column === 'id'));
    return columns;
}

function executeQuery(query, params, queryOptions) {
    return client.execute(query, params, { prepare: true }, queryOptions).then((result) => {
        logger.trace('Query result', {
            query: query,
            params: params,
            rows_returned: result.rowLength
        });
        return Promise.resolve(result.rows ? result.rows : []);
    }).catch((exception) => {
        logger.error(`Cassandra query failed \n ${JSON.stringify({ query, params, queryOptions })}`, exception);
        return Promise.reject(new Error('Error occurred in communication with cassandra'));
    });
}
