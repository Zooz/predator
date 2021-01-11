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
        const value = updateValues[key] instanceof Object ? JSON.stringify(updateValues[key]) : updateValues[key] + '';
        records.push(configClient.upsert({ key: key, value: value }));
    });
    return await Promise.all(records);
}

async function deleteConfig(key) {
    const configClient = client.model('config');
    return await configClient.destroy(
        {
            where: {key: key}
        });
}

async function getConfig() {
    const configClient = client.model('config');
    const options = {
        attributes: { exclude: ['updated_at', 'created_at'] }
    };
    const dbResults = await configClient.findAll(options);
    return dbResults.map(result => (result.dataValues));
}

async function getConfigValue(configValue) {
    const configClient = client.model('config');
    const options = {
        attributes: { exclude: ['updated_at', 'created_at'] }
    };
    options.where = { key: configValue };
    const value = await configClient.findOne(options);
    return value ? [value] : [];
}

async function initSchemas() {
    const config = client.define('config', {
        key: {
            type: Sequelize.DataTypes.STRING,
            primaryKey: true
        },
        value: {
            type: Sequelize.DataTypes.TEXT
        }
    });
    await config.sync();
}
