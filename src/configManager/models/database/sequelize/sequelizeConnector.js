'use strict';

const Sequelize = require('sequelize');
let client;

module.exports = {
    init,
    updateConfig,
    getConfig,
    deleteConfig,
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

async function deleteConfig(key) {
    const configClient = client.model('config');
    const result = await configClient.destroy(
        {
            where: { key: key }
        });
    return result;
}

async function getConfig() {
    const configClient = client.model('config');
    const options = {
        attributes: { exclude: ['updated_at', 'created_at'] }
    };
    const dbResults = await configClient.findAll(options);
    let resultArr = dbResults.map(result => (result.dataValues));
    return resultArr;
}

async function getConfigValue(configValue) {
    const configClient = client.model('config');
    const options = {
        attributes: { exclude: ['updated_at', 'created_at'] }
    };
    options.where = { key: configValue };
    let value = await configClient.findOne(options);
    let response = value ? [value] : [];
    return response;
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
