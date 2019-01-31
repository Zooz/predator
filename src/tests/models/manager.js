'use strict';
let testGenerator = require('./testGenerator');
let database = require('./database');
let logger = require('../../common/logger');
let uuid = require('uuid');

module.exports = {
    upsertTest,
    getTest,
    getAllTestRevision,
    getTests,
    deleteTest
};

function upsertTest(testRawData, existingTestId) {
    return testGenerator.createTest(testRawData)
        .then(function(testArtilleryJson){
            let id = existingTestId || uuid();
            let revisionId = uuid.v4();
            return database.insertTest(testRawData, testArtilleryJson, id, revisionId)
                .then(function(result) {
                    logger.info(result, 'Test created successfully and saved to Cassandra');
                    return {id: id, revision_id: revisionId};
                });
        });
}

function getTest(testId) {
    return database.getTest(testId)
        .then(function(result){
            if (result) {
                result.artillery_test = result.artillery_json;
                delete result.artillery_json;
                return result;
            }
            return undefined;
        });
}

function getAllTestRevision(testId) {
    return database.getAllTestRevisions(testId)
        .then(function(rows){
            if (rows[0]) {
                let tests = [];
                rows.forEach(function(row) {
                    row.artillery_test = row.artillery_json;
                    delete row.artillery_json;
                    tests.push(row);
                });

                return tests;
            }
            return undefined;
        });
}

function getTests() {
    return database.getTests()
        .then(function(rows){
            let tests = [];
            rows.forEach(function(row) {
                if (tests.filter(test => test.id === row.id.toString()).length === 0) {
                    row.artillery_test = row.artillery_json;
                    delete row.artillery_json;
                    tests.push(row);
                }
            });

            return tests;
        });
}

function deleteTest(testId) {
    return database.deleteTest(testId);
}