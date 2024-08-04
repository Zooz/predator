'use strict';
const { getContextId } = require('../../common/context/contextUtil'),
    uuid = require('uuid');

const testGenerator = require('./testGenerator'),
    database = require('./database'),
    fileManager = require('../../files/models/fileManager'),
    downloadManager = require('./downloadManager'),
    { ERROR_MESSAGES } = require('../../common/consts'),
    { TEST_TYPE_DSL } = require('./../../common/consts');

module.exports = {
    upsertTest,
    getTest,
    getAllTestRevisions,
    getTests,
    deleteTest,
    getTestsByProcessorId,
    insertTestBenchmark,
    getBenchmark
};

async function upsertTest(testRawData, existingTestId) {
    const contextId = getContextId();

    if (existingTestId) {
        const test = await database.getTest(existingTestId, contextId);
        if (!test) {
            const error = new Error(ERROR_MESSAGES.NOT_FOUND);
            error.statusCode = 404;
            throw error;
        }
    }

    let testArtilleryJson = await testGenerator.createTest(testRawData);
    const id = existingTestId || uuid();
    let processorFileId;
    if (testRawData.processor_file_url) {
        const downloadedFile = await downloadManager.downloadFile(testRawData.processor_file_url);
        processorFileId = await fileManager.saveFile('processor.js', downloadedFile);
    }
    const revisionId = uuid.v4();
    if (testRawData.type === TEST_TYPE_DSL) {
        testArtilleryJson = undefined;
    }
    await database.insertTest(testRawData, testArtilleryJson, id, revisionId, processorFileId, contextId);
    return { id: id, revision_id: revisionId };
}

async function insertTestBenchmark(benchmarkRawData, testId) {
    const contextId = getContextId();

    const dataParse = JSON.stringify(benchmarkRawData);
    await database.insertTestBenchmark(testId, dataParse, contextId);
    return { benchmark_data: benchmarkRawData };
}

async function getBenchmark(testId) {
    const contextId = getContextId();

    const benchmark = await database.getTestBenchmark(testId, contextId);
    if (!benchmark) {
        const error = new Error(ERROR_MESSAGES.NOT_FOUND);
        error.statusCode = 404;
        throw error;
    }
    return JSON.parse(benchmark);
}

async function getTest(testId) {
    const contextId = getContextId();

    const test = await database.getTest(testId, contextId);
    if (!test) {
        const error = new Error(ERROR_MESSAGES.NOT_FOUND);
        error.statusCode = 404;
        throw error;
    }
    if (test.type === TEST_TYPE_DSL) {
        test.artillery_test = await testGenerator.createTest(test);
    } else {
        test.artillery_test = test.artillery_json;
    }
    delete test.artillery_json;
    return test;
}

async function getAllTestRevisions(testId) {
    const contextId = getContextId();

    const rows = await database.getAllTestRevisions(testId, contextId);
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

async function getTests(filter) {
    const contextId = getContextId();

    const rows = await database.getTests(contextId, filter);
    const testsById = {};
    rows.forEach(function (row) {
        if (!testsById[row.id] || row.updated_at > testsById[row.id].updated_at) {
            testsById[row.id] = row;
        }
    });

    const latestTestsRevisions = [];
    Object.keys(testsById).forEach((id) => {
        testsById[id].artillery_test = testsById[id].artillery_json;
        delete testsById[id].artillery_json;
        latestTestsRevisions.push(testsById[id]);
    });
    return latestTestsRevisions;
}

async function deleteTest(testId) {
    const contextId = getContextId();

    const test = await database.getTest(testId, contextId);
    if (!test) {
        const error = new Error(ERROR_MESSAGES.NOT_FOUND);
        error.statusCode = 404;
        throw error;
    }

    return database.deleteTest(testId);
}

async function getTestsByProcessorId(processorId) {
    const allCurrentTests = await getTests();
    const inUseTestsByProcessor = allCurrentTests.filter(test => test.processor_id && test.processor_id.toString() === processorId);
    return inUseTestsByProcessor;
}
