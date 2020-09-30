'use strict';
const should = require('should'),
    sinon = require('sinon'),
    dsl = require('../../../../src/tests/models/dsl'),
    database = require('../../../../src/tests/models/database');

describe('Testing dsl model', function () {
    let sandbox, getDslDefinitionsStub, getDslDefinitionStub, insertDslDefinitionStub, updateDslDefinitionStub, deleteDefinitionStub;
    before(() => {
        sandbox = sinon.sandbox.create();
        getDslDefinitionsStub = sandbox.stub(database, 'getDslDefinitions')
            .returns([{ artillery_json: 'artillery_json', definition_name: 'definition_name' }]);
        getDslDefinitionStub = sandbox.stub(database, 'getDslDefinition');
        insertDslDefinitionStub = sandbox.stub(database, 'insertDslDefinition');
        updateDslDefinitionStub = sandbox.stub(database, 'updateDslDefinition');
        deleteDefinitionStub = sandbox.stub(database, 'deleteDefinition');
    });

    beforeEach(() => {
        getDslDefinitionStub.returns({ artillery_json: 'artillery_json', definition_name: 'definition_name' });
        insertDslDefinitionStub.returns(true);
        updateDslDefinitionStub.returns(true);
        deleteDefinitionStub.returns(true);
        sandbox.resetHistory();
    });

    after(() => {
        sandbox.restore();
    });

    it('when call getDefinitions - should returns array of definitions', async function () {
        const result = await dsl.getDefinitions('dslName');
        should(getDslDefinitionsStub.args).eql([['dslName']]);
        should(result).eql([{ name: 'definition_name', request: 'artillery_json' }]);
    });
    describe('getDefinition', function () {
        it('when call getDefinition - should return definition object', async function () {
            const result = await dsl.getDefinition('dslName', 'definitionName');
            should(getDslDefinitionStub.args).eql([['dslName', 'definitionName']]);
            should(result).eql({ name: 'definition_name', request: 'artillery_json' });
        });
        it('when call getDefinition - should return 404 when there is no definition object', async function () {
            getDslDefinitionStub.returns(undefined);
            try {
                await dsl.getDefinition('dslName', 'definitionName');
                throw new Error('should not get here');
            } catch (err){
                should(getDslDefinitionStub.args).eql([['dslName', 'definitionName']]);
                should(err.statusCode).eql(404);
                should(err.message).eql('Not found');
            }
        });
    });

    describe('createDefinition', function () {
        it('when call createDefinition - should returns definition object', async function () {
            const result = await dsl.createDefinition('dslName', { name: 'dsl-name', request: 'request' });
            should(insertDslDefinitionStub.args).eql([['dslName', 'dsl-name', 'request']]);
            should(result).eql({ name: 'dsl-name', request: 'request' });
        });
        it('when call createDefinition and definition already exist - should throw 404', async function () {
            insertDslDefinitionStub.returns(false);
            try {
                await dsl.createDefinition('dslName', { name: 'dsl-name', request: 'request' });
                throw new Error('should not get here');
            } catch (err){
                should(insertDslDefinitionStub.args).eql([['dslName', 'dsl-name', 'request']]);
                should(err.message).eql('Definition already exists');
                should(err.statusCode).eql(400);
            }
        });
    });
    describe('updateDefinition', function () {
        it('when call updateDefinition - should returns definition object', async function () {
            const result = await dsl.updateDefinition('dslName', 'dsl-name', { name: 'dsl-name', request: 'request' });
            should(updateDslDefinitionStub.args).eql([['dslName', 'dsl-name', 'request']]);
            should(result).eql({ name: 'dsl-name', request: 'request' });
        });
        it('when call updateDefinition and definition does not exist - should throw 404', async function () {
            updateDslDefinitionStub.returns(false);
            try {
                await dsl.updateDefinition('dslName', 'dsl-name', { name: 'dsl-name', request: 'request' });
                throw new Error('should not get here');
            } catch (err){
                should(updateDslDefinitionStub.args).eql([['dslName', 'dsl-name', 'request']]);
                should(err.message).eql('Not found');
                should(err.statusCode).eql(404);
            }
        });
    });
    describe('deleteDefinition', function () {
        it('when call deleteDefinition - should returns undefined', async function () {
            const result = await dsl.deleteDefinition('dslName', 'dsl-name');
            should(deleteDefinitionStub.args).eql([['dslName', 'dsl-name']]);
            should(result).eql(undefined);
        });
        it('when call deleteDefinition and definition does not exist - should throw 404', async function () {
            deleteDefinitionStub.returns(false);
            try {
                await dsl.deleteDefinition('dslName', 'dsl-name');
                throw new Error('should not get here');
            } catch (err){
                should(deleteDefinitionStub.args).eql([['dslName', 'dsl-name']]);
                should(err.message).eql('Not found');
                should(err.statusCode).eql(404);
            }
        });
    });
});