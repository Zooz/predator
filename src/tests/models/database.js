const sequelizeConnector = require('./database/sequelize/sequelizeConnector'),
    databaseConnector = sequelizeConnector;

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

function insertTest(testInfo, testJson, id, revisionId, processorFileId, csvFileId) {
    return databaseConnector.insertTest(testInfo, testJson, id, revisionId, processorFileId, csvFileId);
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
