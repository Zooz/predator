let logger = require('../../../../common/logger');
let databaseConfig = require('../../../../config/databaseConfig');
let _ = require('lodash');
let client;

const INSERT_PROCESSOR = 'INSERT INTO processors(id, name, description, javascript, created_at, updated_at) values(?,?,?,?,?,?)';
const GET_ALL_PROCESSORS = 'SELECT * FROM processors';
const GET_PROCESSOR_BY_ID = 'SELECT * FROM processors WHERE id=?';
const DELETE_PROCESSOR = 'DELETE FROM processors WHERE id=?';
const UPDATE_PROCESSOR = 'UPDATE processors SET name=?, description=?, javascript=?, updated_at=? WHERE id=? AND created_at=? IF EXISTS';

const INSERT_PROCESSOR_MAPPING = 'INSERT INTO processors_mapping(name, id) VALUES(?, ?)';
const DELETE_PROCESSOR_MAPPING = 'DELETE FROM processors_mapping WHERE name=?';
const GET_PROCESSOR_MAPPING = 'SELECT * FROM processors_mapping WHERE name=?';

module.exports = {
    init,
    insertProcessor,
    getAllProcessors,
    getProcessorById,
    getProcessorByName,
    deleteProcessor,
    updateProcessor,
    _queries: {
        INSERT_PROCESSOR_MAPPING,
        DELETE_PROCESSOR_MAPPING,
        GET_PROCESSOR_MAPPING,
        INSERT_PROCESSOR,
        GET_ALL_PROCESSORS,
        GET_PROCESSOR_BY_ID,
        DELETE_PROCESSOR,
        UPDATE_PROCESSOR
    }
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

async function getProcessorByName(processorName) {
    const [processorMapping] = await executeQuery(GET_PROCESSOR_MAPPING, [processorName], queryOptions);
    if (processorMapping) {
        return getProcessorById(processorMapping.id);
    }
}

async function getProcessorById(processorId) {
    const processor = await executeQuery(GET_PROCESSOR_BY_ID, [processorId], queryOptions);
    return processor[0];
}

async function deleteProcessor(processorId) {
    let params = [processorId];
    let processor = await getProcessorById(processorId);
    if (processor) {
        let mappingParams = [processor.name];
        return Promise.all([executeQuery(DELETE_PROCESSOR, params, queryOptions), executeQuery(DELETE_PROCESSOR_MAPPING, mappingParams, queryOptions)]);
    }
}

async function insertProcessor(processorId, processorInfo) {
    let params = [processorId, processorInfo.name, processorInfo.description, processorInfo.javascript, Date.now(), Date.now()];
    let mappingParams = [processorInfo.name, processorId];
    const [processor] = await Promise.all([executeQuery(INSERT_PROCESSOR, params, queryOptions), executeQuery(INSERT_PROCESSOR_MAPPING, mappingParams, queryOptions)]);
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
