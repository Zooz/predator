let logger = require('../../../../common/logger');
let databaseConfig = require('../../../../config/databaseConfig');
let _ = require('lodash');
let client;

const INSERT_PROCESSOR = 'INSERT INTO processors(id, name, description, javascript, created_at, updated_at) values(?,?,?,?,?,?)';
const GET_ALL_PROCESSORS = 'SELECT * FROM processors';
const GET_PROCESSOR = 'SELECT * FROM processors where id=?';
const DELETE_PROCESSOR = 'DELETE FROM processors WHERE id=?';
const UPDATE_PROCESSOR = 'UPDATE processors SET name=?, description=?, javascript=?, updated_at=? WHERE id=? AND created_at=? IF EXISTS';

module.exports = {
    init,
    insertProcessor,
    getAllProcessors,
    getProcessor,
    deleteProcessor,
    updateProcessor
};

let queryOptions = {
    consistency: databaseConfig.cassandraConsistency,
    prepare: true
};

async function init(cassandraClient) {
    client = cassandraClient;
}

async function getAllProcessors(from, limit) {
    const resultRows = await executeQuery(GET_ALL_PROCESSORS, [], queryOptions);
    return _(resultRows).slice(from).take(limit).value();
}

async function getProcessor(processorId) {
    const processor = await executeQuery(GET_PROCESSOR, [processorId], queryOptions);
    return processor[0];
}

function deleteProcessor(processorId) {
    let params = [processorId];
    return executeQuery(DELETE_PROCESSOR, params, queryOptions);
}

async function insertProcessor(processorId, processorInfo) {
    let params = [processorId, processorInfo.name, processorInfo.description, processorInfo.javascript, Date.now(), Date.now()];
    const processor = await executeQuery(INSERT_PROCESSOR, params, queryOptions);
    return processor;
}

async function updateProcessor(processorId, updatedProcessor) {
    const { name, description, javascript, created_at: createdAt } = updatedProcessor;
    const params = [ name, description, javascript, Date.now(), processorId, createdAt.getTime() ];
    return executeQuery(UPDATE_PROCESSOR, params, {});
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
