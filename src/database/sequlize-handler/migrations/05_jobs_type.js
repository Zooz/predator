const Sequelize = require('sequelize');

module.exports.up = async (query, DataTypes) => {
    let jobsTable = await query.describeTable('jobs');

    if (!jobsTable.enabled) {
        await query.addColumn(
            'jobs', 'type',
            Sequelize.DataTypes.STRING);
    }
};

module.exports.down = async (query, DataTypes) => {
    await query.removeColumn('jobs', 'type');
};