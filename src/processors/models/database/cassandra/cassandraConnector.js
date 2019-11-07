let logger = require('../../../../common/logger');
let databaseConfig = require('../../../../config/databaseConfig');
let _ = require('lodash');
let client;

const INSERT_PROCESSOR = 'INSERT INTO processors(processor_id, name, description, type, file_url, javascript, created_at, updated_at) values(?,?,?,?,?,?,?,?)';
const GET_ALL_PROCESSORS = 'SELECT * FROM processors';
const DELETE_PROCESSOR = 'DELETE FROM processors WHERE id=?';

module.exports = {
    init,
    insertProcessor,
    getAllProcessors,
    deleteProcessor
};

let queryOptions = {
    consistency: databaseConfig.cassandraConsistency,
    prepare: true
};

async function init(cassandraClient) {
    client = cassandraClient;
}

async function getAllProcessors(from, limit) {
    const resultRows = await executeQuery(GET_ALL_PROCESSORS, [], {});
    return _(resultRows).slice(from).take(limit).value();
}

function insertProcessor(processorId, processorInfo) {
    let params = [processorId, processorInfo.name, processorInfo.description, processorInfo.type, processorInfo.file_url, processorInfo.javascript, Date.now(), Date.now()];
    return executeQuery(INSERT_PROCESSOR, params, queryOptions);
}

function deleteProcessor(processorId) {
    let params = [processorId];
    return executeQuery(DELETE_PROCESSOR, params, queryOptions);
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
