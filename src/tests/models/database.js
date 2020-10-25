const sequelizeConnector = require('./database/sequelize/sequelizeConnector');

const databaseConnector = sequelizeConnector;

module.exports = {
    insertTest,
    getAllTestRevisions,
    getTest,
    getTests,
    deleteTest,
    insertDslDefinition,
    getDslDefinition,
    getDslDefinitions,
    updateDslDefinition,
    deleteDefinition,
    insertTestBenchmark,
    getTestBenchmark
};

function insertTest(testInfo, testJson, id, revisionId, processorFileId, contextId) {
    return databaseConnector.insertTest(testInfo, testJson, id, revisionId, processorFileId, contextId);
}

async function getTest(id, contextId) {
    return databaseConnector.getTest(id, contextId);
}
async function getTests(contextId) {
    return databaseConnector.getTests(contextId);
}

async function deleteTest(testId, contextId) {
    return databaseConnector.deleteTest(testId, contextId);
}

async function insertTestBenchmark(testId, benchmarkData, contextId) {
    return databaseConnector.insertTestBenchmark(testId, benchmarkData, contextId);
}

async function getTestBenchmark(id, contextId) {
    return databaseConnector.getTestBenchmark(id, contextId);
}

async function getAllTestRevisions(testId, contextId) {
    return databaseConnector.getAllTestRevisions(testId, contextId);
}
async function insertDslDefinition(dslName, definitionName, data, contextId) {
    return databaseConnector.insertDslDefinition(dslName, definitionName, data, contextId);
}
async function updateDslDefinition(dslName, definitionName, data, contextId) {
    return databaseConnector.updateDslDefinition(dslName, definitionName, data, contextId);
}
async function deleteDefinition(dslName, definitionName, contextId) {
    return databaseConnector.deleteDefinition(dslName, definitionName, contextId);
}
async function getDslDefinition(dslName, definitionName, contextId) {
    return databaseConnector.getDslDefinition(dslName, definitionName, contextId);
}
async function getDslDefinitions(dslName, contextId) {
    return databaseConnector.getDslDefinitions(dslName, contextId);
}
