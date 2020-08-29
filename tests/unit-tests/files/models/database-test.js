
const should = require('should'),
    sinon = require('sinon'),
    sequelizeConnector = require('../../../../src/files/models/database/sequelize/sequelizeConnector'),
    rewire = require('rewire'),
    databaseConfig = require('../../../../src/config/databaseConfig');
let database = require('../../../../src/files/models/database');
const functions = [
    {
        functionName: 'saveFile',
        args: ['id', 'name', 'file']
    },
    {
        functionName: 'getFile',
        args: ['id', true]
    },
];

describe('Testing database', function () {
    let sandbox;
    before(function () {
        process.env.DATABASE_TYPE = 'SQLITE';
        sandbox = sinon.sandbox.create();
        functions.forEach(function (func) {
            sandbox.stub(sequelizeConnector, func.functionName);
        });
    });
    beforeEach(function () {
        sandbox.resetHistory();
    });
    after(function () {
        sandbox.restore();
    });

    describe('when database type is not cassandra - should applied functions on sequlize client', function () {
        before(async function () {
            databaseConfig.type = 'not-cassandra';
            database = rewire('../../../../src/files/models/database');
        });
        functions.forEach(function (func) {
            it(`checking func: ${func.functionName}`, async function () {
                await database[func.functionName](...func.args);
                should(sequelizeConnector[func.functionName].args).eql([func.args]);
            });
        });
    });
});
