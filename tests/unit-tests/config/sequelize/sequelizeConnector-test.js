'use strict';
const sinon = require('sinon');
const rewire = require('rewire');
const should = require('should');
let databaseConfig = require('../../../../src/config/databaseConfig');
const sequelizeConnector = rewire('../../../../src/configManager/models/database/sequelize/sequelizeConnector');

describe('Cassandra client tests', function () {
    let sandbox,
        sequelizeModelStub,
        sequelizeUpsertStub,
        sequelizeStub,
        sequelizeDefineStub,
        sequelizeGeValueetStub,
        sequelizeGetStub;

    before(() => {
        sandbox = sinon.sandbox.create();
    });

    beforeEach(() => {
        databaseConfig.type = 'SQLITE';
        databaseConfig.name = 'predator';
        databaseConfig.username = 'username';
        databaseConfig.password = 'password';

        sequelizeModelStub = sandbox.stub();
        sequelizeUpsertStub = sandbox.stub();
        sequelizeDefineStub = sandbox.stub();
        sequelizeGetStub = sandbox.stub();
        sequelizeStub = sandbox.stub();
        sequelizeStub = sandbox.stub();
        sequelizeGeValueetStub = sandbox.stub();

        sequelizeDefineStub.returns({
            hasMany: () => {
            },
            sync: () => {
            }
        });

        sequelizeModelStub.returns({
            key: {},
            value: {},
            findAll: sequelizeGetStub,
            find: sequelizeGeValueetStub,
            upsert: sequelizeUpsertStub
        });

        sequelizeStub.returns({
            model: sequelizeModelStub,
            define: sequelizeDefineStub
        });
        sequelizeStub.DataTypes = {};

        afterEach(() => {
            sandbox.resetHistory();
        });

        after(() => {
            sandbox.restore();
        });
    });

    describe('Update new config record', function () {
        it('should succeed simple update', async () => {
            await sequelizeConnector.init(sequelizeStub());
            await sequelizeConnector.updateConfig({ test_key: 'test_value' });
            should(sequelizeUpsertStub.args[0][0]).eql({ key: 'test_key', value: 'test_value' });
        });
    });

    describe('Update new config record object as value', () => {
        it('should succeed object value update', async () => {
            await sequelizeConnector.init(sequelizeStub());
            let jsonToSave = { jsonTest: 'test_value' };
            await sequelizeConnector.updateConfig({ test_key_json: jsonToSave });
            should(sequelizeUpsertStub.args[0][0]).eql({ key: 'test_key_json', value: JSON.stringify(jsonToSave) });
        });
    });

    describe('Update new config multiple records object and strings as value', () => {
        it('should succeed object value update', async () => {
            await sequelizeConnector.init(sequelizeStub());
            let jsonToSave = { jsonTest: 'test_value' };
            await sequelizeConnector.updateConfig({ test_key: 'test_value', test_key_json: jsonToSave });
            should(sequelizeUpsertStub.args[0][0]).eql({ key: 'test_key', value: 'test_value' });
            should(sequelizeUpsertStub.args[1][0]).eql({ key: 'test_key_json', value: JSON.stringify(jsonToSave) });
        });
    });

    describe('Get all config with data', () => {
        it('should succeed to get  multiple configs', async () => {
            await sequelizeConnector.init(sequelizeStub());
            let sequelizeResponse = [
                { dataValues: { key: 'firstKey', value: 'firstValue' } },
                { dataValues: { key: 'secondKey', value: 'secondValue' } }
            ];
            sequelizeGetStub.resolves(sequelizeResponse);
            let config = await sequelizeConnector.getConfig();
            should(config.length).eql(2);
            should(config[0]).eql({ key: 'firstKey', value: 'firstValue' });
            should(config[1]).eql({ key: 'secondKey', value: 'secondValue' });
        });
    });

    describe('Get all config with no data ', () => {
        it('should succeed to get  multiple configs', async () => {
            await sequelizeConnector.init(sequelizeStub());
            sequelizeGetStub.resolves([]);
            await sequelizeConnector.getConfig();
            should(sequelizeGetStub.args[0][0].attributes.exclude[0]).eql('updated_at');
            should(sequelizeGetStub.args[0][0].attributes.exclude[1]).eql('created_at');
        });
    });
    describe('Get  config value with no data ', () => {
        it('should succeed to get  multiple configs', async () => {
            await sequelizeConnector.init(sequelizeStub());
            sequelizeGetStub.resolves([]);
            await sequelizeConnector.getConfigValue('key_value');
            should(sequelizeGeValueetStub.args[0][0].attributes.exclude[0]).eql('updated_at');
            should(sequelizeGeValueetStub.args[0][0].attributes.exclude[1]).eql('created_at');
            should(sequelizeGeValueetStub.args[0][0].where.key).eql('key_value');
        });
    });
});