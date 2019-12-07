let logger = require('../../../../common/logger');
let cassandra = require('cassandra-driver');
let client = {};
let uuid = require('cassandra-driver').types.Uuid;
const sanitizeHelper = require('../../../helpers/sanitizeHelper');

const INSERT_TEST_DETAILS = 'INSERT INTO tests(id, name, description, type, updated_at, raw_data, artillery_json, revision_id, file_id, processor_id) values(?,?,?,?,?,?,?,?,?,?)';
const GET_TEST = 'SELECT * FROM tests WHERE id = ? ORDER BY updated_at DESC limit 1';
const GET_TEST_REVISIONS = 'SELECT * FROM tests WHERE id = ?';
const GET_TESTS = 'SELECT * FROM tests';
const DELETE_TEST = 'DELETE FROM tests WHERE id=?';

const INSERT_DSL_DEFINITION_IF_NOT_EXIST = 'INSERT INTO dsl(dsl_name, definition_name, artillery_json) values(?,?,?) IF NOT EXISTS';
const UPDATE_DSL_DEFINITION = 'UPDATE dsl SET artillery_json= ? WHERE dsl_name = ? AND definition_name = ? IF EXISTS;';
const DELETE_DSL_DEFINITION = 'DELETE FROM dsl WHERE dsl_name = ? AND definition_name = ? IF EXISTS;';
const GET_DSL_DEFINITION = 'SELECT * FROM dsl WHERE dsl_name = ? AND definition_name = ? limit 1';
const GET_DSL_DEFINITIONS = 'SELECT * FROM dsl WHERE dsl_name = ?';

const INSERT_FILE = 'INSERT INTO files(id,file) values(?,?)';
const GET_FILE = 'SELECT file FROM files WHERE id = ?';

module.exports = {
    init,
    insertTest,
    getAllTestRevisions,
    getTest,
    getTests,
    deleteTest,
    insertDslDefinition,
    getDslDefinition,
    getDslDefinitions,
    updateDslDefinition,
    saveFile,
    getFile,
    deleteDefinition
};

let queryOptions = {
    consistency: cassandra.types.consistencies.localQuorum,
    prepare: true
};

function init(cassandraClient) {
    client = cassandraClient;
}

async function getTest(id) {
    id = uuid.fromString(id);
    const result = await executeQuery(GET_TEST, [id], queryOptions);
    const sanitizedResult = sanitizeTestResult(result.rows)[0];
    return sanitizedResult;
}

async function getTests() {
    const result = await executeQuery(GET_TESTS, [], queryOptions);
    const sanitizedResult = sanitizeTestResult(result.rows);
    return sanitizedResult;
}

async function deleteTest(testId){
    const result = await executeQuery(DELETE_TEST, [testId]);
    return result;
}

async function getAllTestRevisions(id) {
    id = uuid.fromString(id);
    const result = await executeQuery(GET_TEST_REVISIONS, [id], queryOptions);
    const sanitizedResult = await sanitizeTestResult(result.rows);
    return sanitizedResult;
}

async function insertTest(testInfo, testJson, id, revisionId, testId) {
    let params;
    params = [id, testInfo.name, testInfo.description, testInfo.type, Date.now(), JSON.stringify(testInfo), JSON.stringify(testJson), revisionId, testId, testInfo.processor_id];
    const result = await executeQuery(INSERT_TEST_DETAILS, params, queryOptions);
    return result;
}

async function getDslDefinition(dslName, definitionName) {
    const params = [dslName, definitionName];
    const result = await executeQuery(GET_DSL_DEFINITION, params, queryOptions);
    const sanitizedResult = sanitizeDslResult(result.rows);
    return sanitizedResult[0];
}
async function getDslDefinitions(dslName) {
    const params = [dslName];
    const result = await executeQuery(GET_DSL_DEFINITIONS, params, queryOptions);
    const sanitizedResult = sanitizeDslResult(result.rows);
    return sanitizedResult;
}

async function insertDslDefinition(dslName, definitionName, data) {
    const params = [dslName, definitionName, JSON.stringify(data)];
    const result = await executeQuery(INSERT_DSL_DEFINITION_IF_NOT_EXIST, params, queryOptions);
    return result.rows[0]['[applied]'];
}

async function updateDslDefinition(dslName, definitionName, data) {
    const params = [JSON.stringify(data), dslName, definitionName];
    const result = await executeQuery(UPDATE_DSL_DEFINITION, params, queryOptions);
    return result.rows[0]['[applied]'];
}
async function deleteDefinition(dslName, definitionName) {
    const params = [dslName, definitionName];
    const result = await executeQuery(DELETE_DSL_DEFINITION, params, queryOptions);
    return result.rows[0]['[applied]'];
}

async function executeQuery(query, params, queryOptions) {
    try {
        const result = await client.execute(query, params, queryOptions);
        logger.trace('Query result', {
            query: query,
            params: params,
            rows_returned: result.rowLength
        });
        return result;
    } catch (err){
        logger.error(`Cassandra query failed \n ${JSON.stringify({ query, params, queryOptions })}`, err);
        throw new Error('Error occurred in communication with cassandra');
    }
}

function sanitizeTestResult(data) {
    const result = data.map(function (row) {
        const dslDataObject = sanitizeHelper.extractDslRootData(row.raw_data);
        row.artillery_json = JSON.parse(row.artillery_json);
        row.file_id = row.file_id || undefined;
        row.processor_id = row.processor_id || undefined;
        delete row.raw_data;
        return Object.assign(row, dslDataObject);
    });
    return result;
}

function sanitizeDslResult(data) {
    const result = data.map(function (row) {
        row.artillery_json = JSON.parse(row.artillery_json);
        return row;
    });
    return result;
}

async function saveFile(id, file) {
    let params = [id, file];
    const result = await executeQuery(INSERT_FILE, params, queryOptions);
    return result;
}

async function getFile(id) {
    const result = await executeQuery(GET_FILE, [id], queryOptions);
    return result.rows[0] ? result.rows[0].file : undefined;
}
