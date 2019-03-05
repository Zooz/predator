'use strict';

const Sequelize = require('sequelize');
let client;

module.exports = {
    init,
    updateConfig,
    getConfig,
    getConfigValue

};

async function init(sequelizeClient) {
    client = sequelizeClient;
    await initSchemas();
}

async function updateConfig(updateValues) {
    const configClient = client.model('config');
    const records = [];
    Object.keys(updateValues).forEach(key => {
        let value = updateValues[key] instanceof Object ? JSON.stringify(updateValues[key]) : updateValues[key] + '';
        records.push(configClient.upsert({ key: key, value: value }));
    });
    const results = await Promise.all(records);
    return results;
}

async function getConfig() {
    const configClient = client.model('config');
    const options = {
        attributes: { exclude: ['updated_at', 'created_at'] }
    };
    const dbResults = await configClient.findAll(options);
    const resultArr = dbResults.map(result => (result.dataValues));
    return resultArr;
}

async function getConfigValue(configValue) {
    const configClient = client.model('config');
    const options = {
        attributes: { exclude: ['updated_at', 'created_at'] }
    };
    options.where = { key: configValue };
    const dbResult = await configClient.find(options);
    // todo: IF NOT EXISTS? throw error
    return dbResult;
}

async function initSchemas() {
    const config = client.define('config', {
        key: {
            type: Sequelize.DataTypes.STRING,
            primaryKey: true
        },
        value: {
            type: Sequelize.DataTypes.STRING
        }
    });
    await config.sync();
}