
const should = require('should'),
    sinon = require('sinon'),
    cassandra = require('../../../../src/tests/models/database/cassandra/cassandraConnector'),
    sequelizeConnector = require('../../../../src/tests/models/database/sequelize/sequelizeConnector'),
    rewire = require('rewire'),
    databaseConfig = require('../../../../src/config/databaseConfig');
let database = require('../../../../src/tests/models/database');

const functions = [
    {
        functionName: 'insertTest',
        args: ['testInfo', 'testJson', 'id', 'revisionId', 'fileId']
    },
    {
        functionName: 'getTest',
        args: ['id']
    },
    {
        functionName: 'getTests',
        args: []
    },
    {
        functionName: 'deleteTest',
        args: ['id']
    },
    {
        functionName: 'insertDslDefinition',
        args: ['dslName', 'definitionName', 'data']
    }, {
        functionName: 'getDslDefinition',
        args: ['dslName', 'definitionName']
    }, {
        functionName: 'getDslDefinitions',
        args: ['dslName']
    },
    {
        functionName: 'updateDslDefinition',
        args: ['dslName', 'definitionName', 'data']
    },
    {
        functionName: 'deleteDefinition',
        args: ['dslName', 'definitionName']
    },
    {
        functionName: 'getTestsByProcessorId',
        args: ['processorId']
    }

];

describe('Testing database', function () {
    let sandbox;
    before(function () {
        process.env.DATABASE_TYPE = 'CASSANDRA';
        sandbox = sinon.sandbox.create();
        functions.forEach(function (func) {
            sandbox.stub(cassandra, func.functionName);
            sandbox.stub(sequelizeConnector, func.functionName);
        });
    });
    beforeEach(function () {
        sandbox.resetHistory();
    });
    after(function () {
        sandbox.restore();
    });

    describe('when database type is cassandra - should applied functions on cassandra client', function () {
        before(async function () {
            databaseConfig.type = 'cassandra';
            database = rewire('../../../../src/tests/models/database');
        });
        functions.forEach(function (func) {
            it(`checking func: ${func.functionName}`, async function () {
                await database[func.functionName](...func.args);
                should(cassandra[func.functionName].args).eql([func.args]);
            });
        });
    });
    describe('when database type is not cassandra - should applied functions on sequlize client', function () {
        before(async function () {
            databaseConfig.type = 'not-cassandra';
            database = rewire('../../../../src/tests/models/database');
        });
        functions.forEach(function (func) {
            it(`checking func: ${func.functionName}`, async function () {
                await database[func.functionName](...func.args);
                should(sequelizeConnector[func.functionName].args).eql([func.args]);
            });
        });
    });
});
