let logger = require('../../../../common/logger');
let cassandra = require('cassandra-driver');
let client = {};

const INSERT_FILE = 'INSERT INTO files(id,name,file) values(?,?,?)';
const GET_FILE = 'SELECT file FROM files WHERE id = ?';

module.exports = {
    init,
    saveFile,
    getFile
};

let queryOptions = {
    consistency: cassandra.types.consistencies.localQuorum,
    prepare: true
};

function init(cassandraClient) {
    client = cassandraClient;
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

async function saveFile(id, fileName, fileContent) {
    let params = [id, fileName, fileContent];
    const result = await executeQuery(INSERT_FILE, params, queryOptions);
    return result;
}

async function getFile(id) {
    const result = await executeQuery(GET_FILE, [id], queryOptions);
    return result.rows[0] ? result.rows[0] : undefined;
}
