const logger = require('../../../../common/logger');
const databaseConfig = require('../../../../config/databaseConfig');
const GET_CONFIG_VALUE = 'SELECT* FROM config WHERE key= ?';
const GET_CONFIG = 'SELECT* FROM config';
const INSERT_DATA = 'INSERT INTO config(key, value) values(?,?)';

let client;

module.exports = {
    init,
    updateConfig,
    getConfig,
    getConfigValue
};
function init(cassandraClient) {
    client = cassandraClient;
}

const queryOptions = {
    consistency: databaseConfig.cassandraConsistency,
    prepare: true
};

function updateConfig(updateValues) {
    let queriesArr = [];
    Object.keys(updateValues).forEach(key => {
        let value = updateValues[key] instanceof Object ? JSON.stringify(updateValues[key]) : updateValues[key];
        queriesArr.push({ 'query': INSERT_DATA, 'params': [key, value] });
    });
    return batchUpsert(queriesArr, queryOptions);
}

function getConfigValue(configValue) {
    return executeQuery(GET_CONFIG_VALUE, configValue);
}

function getConfig() {
    return executeQuery(GET_CONFIG);
}

async function batchUpsert(queriesArr, queryOptions) {
    try {
        const result = client.batch(queriesArr, queryOptions);
        logger.trace('Query result', {
            queryArr: queriesArr,
            queryOptions: queryOptions,
            rows_returned: result.rowLength
        });
        return Promise.resolve(result.rows ? result.rows : []);
    } catch (exception) {
        logger.error(`Cassandra batch failed \n ${JSON.stringify({ queriesArr, queryOptions })}`, exception);
        return Promise.reject(new Error('Error occurred in communication with cassandra'));
    }
}

async function executeQuery(query, params) {
    try {
        let result = await client.execute(query, params, { prepare: true }, queryOptions);
        logger.trace('Query result', {
            query: query,
            params: params,
            rows_returned: result.rowLength
        });
        return Promise.resolve(result.rows ? result.rows : []);
    } catch (exception) {
        logger.error(`Cassandra query failed \n ${JSON.stringify({ query, params, queryOptions })}`, exception);
        return Promise.reject(new Error('Error occurred in communication with cassandra'));
    }
}