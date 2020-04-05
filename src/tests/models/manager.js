'use strict';
const testGenerator = require('./testGenerator'),
    database = require('./database'),
    uuid = require('uuid'),
    fileManager = require('./fileManager'),
    { ERROR_MESSAGES } = require('../../common/consts');

module.exports = {
    upsertTest,
    getTest,
    getAllTestRevisions,
    getTests,
    deleteTest,
    getTestsByProcessorId,
    insertTestBenchMark,
    getBenchmark
};

async function upsertTest(testRawData, existingTestId) {
    const testArtilleryJson = await testGenerator.createTest(testRawData);
    let id = existingTestId || uuid();
    let fileId;
    if (testRawData['processor_file_url']){
        fileId = await fileManager.saveFile(testRawData['processor_file_url']);
    }
    let revisionId = uuid.v4();
    await database.insertTest(testRawData, testArtilleryJson, id, revisionId, fileId);
    return { id: id, revision_id: revisionId };
}

async function insertTestBenchMark(benchMarkRawData, testId) {
    const dataParse = JSON.stringify(benchMarkRawData);
    await database.insertTestBenchMark(testId, dataParse);
    return { benchmark_data: benchMarkRawData };
}
async function getBenchmark(testId) {
    const res = await database.getTestBenchMark(testId);
    return res ? JSON.parse(res) : {};
}

async function getTest(testId) {
    const result = await database.getTest(testId);
    if (result) {
        result.artillery_test = result.artillery_json;
        delete result.artillery_json;
        return result;
    } else {
        const error = new Error(ERROR_MESSAGES.NOT_FOUND);
        error.statusCode = 404;
        throw error;
    }
}

async function getAllTestRevisions(testId) {
    const rows = await database.getAllTestRevisions(testId);
    const testRevisions = [];
    rows.forEach(function (row) {
        row.artillery_test = row.artillery_json;
        delete row.artillery_json;
        testRevisions.push(row);
    });
    if (testRevisions.length !== 0) {
        return testRevisions;
    } else {
        const error = new Error(ERROR_MESSAGES.NOT_FOUND);
        error.statusCode = 404;
        throw error;
    }
}

async function getTests() {
    const rows = await database.getTests();
    const testsById = {};
    rows.forEach(function (row) {
        if (!testsById[row.id] || row.updated_at > testsById[row.id].updated_at) {
            testsById[row.id] = row;
        }
    });

    let latestTestsRevisions = [];
    Object.keys(testsById).forEach((id) => {
        testsById[id].artillery_test = testsById[id].artillery_json;
        delete testsById[id].artillery_json;
        latestTestsRevisions.push(testsById[id]);
    });
    return latestTestsRevisions;
}

function deleteTest(testId) {
    return database.deleteTest(testId);
}

async function getTestsByProcessorId(processorId) {
    const allCurrentTests = await getTests();
    const inUseTestsByProcessor = allCurrentTests.filter(test => test.processor_id && test.processor_id.toString() === processorId);
    return inUseTestsByProcessor;
}
