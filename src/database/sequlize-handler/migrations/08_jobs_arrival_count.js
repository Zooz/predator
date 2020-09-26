const Sequelize = require('sequelize');

module.exports.up = async (query, DataTypes) => {
    let jobsTable = await query.describeTable('jobs');

    if (!jobsTable.arrival_count) {
        await query.addColumn(
            'jobs', 'arrival_count',
            Sequelize.DataTypes.INTEGER);
    }
};

module.exports.down = async (query, DataTypes) => {
    await query.removeColumn('jobs', 'arrival_count');
};
