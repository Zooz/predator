const Sequelize = require('sequelize');

module.exports.up = async (query, DataTypes) => {
    const jobsTable = await query.describeTable('jobs');

    if (!jobsTable.type) {
        await query.addColumn(
            'jobs', 'type',
            Sequelize.DataTypes.STRING);

        await query.bulkUpdate('jobs', { type: 'load_test' });
    }
};

module.exports.down = async (query, DataTypes) => {
    await query.removeColumn('jobs', 'type');
};