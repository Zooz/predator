const cassandraConnector = require('./database/cassandra/cassandraConnector'),
    sequelizeConnector = require('./database/sequelize/sequelizeConnector'),
    databaseConfig = require('../../config/databaseConfig'),
    databaseConnector = databaseConfig.type.toLowerCase() === 'cassandra' ? cassandraConnector : sequelizeConnector;

module.exports = {
    insertTest,
    getAllTestRevisions,
    getTest,
    getTests,
    deleteTest,
    saveFile,
    insertDslDefinition,
    getDslDefinition,
    getDslDefinitions,
    updateDslDefinition,
    getFile,
    deleteDefinition,
    insertTestBenchmark,
    getTestBenchmark
};

function insertTest(testInfo, testJson, id, revisionId, fileId) {
    return databaseConnector.insertTest(testInfo, testJson, id, revisionId, fileId);
}

async function getTest(id) {
    return databaseConnector.getTest(id);
}
async function getTests() {
    return databaseConnector.getTests();
}

async function deleteTest(testId) {
    return databaseConnector.deleteTest(testId);
}

async function insertTestBenchmark(testId, benchmarkData) {
    return databaseConnector.insertTestBenchmark(testId, benchmarkData);
}

async function getTestBenchmark(id) {
    return databaseConnector.getTestBenchmark(id);
}

async function getAllTestRevisions(testId) {
    return databaseConnector.getAllTestRevisions(testId);
}
async function insertDslDefinition(dslName, definitionName, data) {
    return databaseConnector.insertDslDefinition(dslName, definitionName, data);
}
async function updateDslDefinition(dslName, definitionName, data) {
    return databaseConnector.updateDslDefinition(dslName, definitionName, data);
}
async function deleteDefinition(dslName, definitionName) {
    return databaseConnector.deleteDefinition(dslName, definitionName);
}
async function getDslDefinition(dslName, definitionName) {
    return databaseConnector.getDslDefinition(dslName, definitionName);
}
async function getDslDefinitions(dslName) {
    return databaseConnector.getDslDefinitions(dslName);
}

async function saveFile(id, file) {
    return databaseConnector.saveFile(id, file);
}
async function getFile(id) {
    return databaseConnector.getFile(id);
}
