const Sequelize = require('sequelize');

module.exports.up = async (query, DataTypes) => {
    await query.addColumn(
        'jobs', 'proxy_url',
        Sequelize.DataTypes.STRING);

    await query.addColumn(
        'jobs', 'debug',
        Sequelize.DataTypes.STRING);
};

module.exports.down = async (query, DataTypes) => {
    await query.removeColumn('jobs', 'proxy_url');
    await query.removeColumn('jobs', 'debug');
};