const Sequelize = require('sequelize');

module.exports.up = async (query, DataTypes) => {
    const jobsTable = await query.describeTable('jobs');

    if (!jobsTable.enabled) {
        await query.addColumn(
            'jobs', 'enabled',
            Sequelize.DataTypes.BOOLEAN);
    }
};

module.exports.down = async (query, DataTypes) => {
    await query.removeColumn('jobs', 'enabled');
};