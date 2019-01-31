let logger = require('../../../../common/logger');
let cassandra = require('cassandra-driver');
let client = {};
let uuid = require('cassandra-driver').types.Uuid;

const INSERT_TEST_DETAILS = 'INSERT INTO tests(id, name, description, type, updated_at, raw_data, artillery_json, revision_id) values(?,?,?,?,?,?,?,?)';
const GET_TEST = 'SELECT * FROM tests WHERE id = ? ORDER BY updated_at DESC limit 1';
const GET_TEST_REVISIONS = 'SELECT * FROM tests WHERE id = ?';
const GET_TESTS = 'SELECT * FROM tests';
const DELETE_TEST = 'DELETE FROM tests WHERE id=?';

const INSERT_DSL_DEFINITION_IF_NOT_EXIST = 'INSERT INTO dsl(dsl_name, definition_name, artillery_json) values(?,?,?) IF NOT EXISTS';
const UPDATE_DSL_DEFINITION = 'UPDATE dsl SET artillery_json= ? WHERE dsl_name = ? AND definition_name = ? IF EXISTS;';
const DELETE_DSL_DEFINITION = 'DELETE FROM dsl WHERE dsl_name = ? AND definition_name = ? IF EXISTS;';
const GET_DSL_DEFINITION = 'SELECT * FROM dsl WHERE dsl_name = ? AND definition_name = ? limit 1';
const GET_DSL_DEFINITIONS = 'SELECT * FROM dsl WHERE dsl_name = ?';

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
    deleteDefinition
};

let queryOptions = {
    consistency: cassandra.types.consistencies.localQuorum,
    prepare: true
};

function init(cassandraClient) {
    client = cassandraClient;
    logger.info('Tests cassandra client initialized');
}

function getTest(id) {
    id = uuid.fromString(id);
    return executeQuery(GET_TEST, [id], queryOptions)
        .then(function(result) {
            return Promise.resolve(sanitizeTestResult(result.rows)[0]);
        });
}

function getTests() {
    let tests = [];
    return executeQuery(GET_TESTS, [], queryOptions)
        .then(function(result){
            result.rows.forEach(function(row) {
                if (!tests.find(test => test.id.toString() === row.id.toString())) {
                    tests.push(row);
                }
            });

            return Promise.resolve(sanitizeTestResult(tests));
        });
}

function deleteTest(testId){
    return executeQuery(DELETE_TEST, [testId]);
}

function getAllTestRevisions(id) {
    id = uuid.fromString(id);
    return executeQuery(GET_TEST_REVISIONS, [id], queryOptions)
        .then(function(result) {
            return Promise.resolve(sanitizeTestResult(result.rows));
        });
}

async function insertTest(testInfo, testJson, id, revisionId) {
    let params;
    params = [id, testInfo.name, testInfo.description, testInfo.type, Date.now(), JSON.stringify(testInfo.scenarios), JSON.stringify(testJson), revisionId];
    return executeQuery(INSERT_TEST_DETAILS, params, queryOptions);
}

async function getDslDefinition(dslName, definitionName) {
    const params = [dslName, definitionName];
    const result = await executeQuery(GET_DSL_DEFINITION, params, queryOptions);
    if (result.rows.length === 0){
        return;
    }
    result.rows[0].artillery_json = JSON.parse(result.rows[0].artillery_json);
    return result.rows[0];
}
async function getDslDefinitions(dslName) {
    const params = [dslName];
    const result = await executeQuery(GET_DSL_DEFINITIONS, params, queryOptions);

    result.rows.forEach(function (row) {
        row.artillery_json = JSON.parse(row.artillery_json);
    });
    return result.rows;
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

function executeQuery(query, params, queryOptions) {
    return client.execute(query, params, queryOptions).then((result) => {
        logger.trace('Query result', {
            query: query,
            params: params,
            rows_returned: result.rowLength
        });
        return Promise.resolve(result);
    }).catch((exception) => {
        logger.error(`Cassandra query failed \n ${JSON.stringify({ query, params, queryOptions })}`, exception);
        return Promise.reject(new Error('Error occurred in communication with cassandra'));
    });
}

function sanitizeTestResult(rows) {
    return rows.map(function (row) {
        row.artillery_json = JSON.parse(row.artillery_json);
        row.raw_data = JSON.parse(row.raw_data);
        return row;
    });
}