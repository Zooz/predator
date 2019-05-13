const Sequelize = require('sequelize');

module.exports.up = async (query, DataTypes) => {
    let jobsTable = await query.describeTable('jobs');

    if (!jobsTable.proxy_url) {
        await query.addColumn(
            'jobs', 'proxy_url',
            Sequelize.DataTypes.STRING);
    }

    if (!jobsTable.debug) {
        await query.addColumn(
            'jobs', 'debug',
            Sequelize.DataTypes.STRING);
    }
};

module.exports.down = async (query, DataTypes) => {
    await query.removeColumn('jobs', 'proxy_url');
    await query.removeColumn('jobs', 'debug');
};