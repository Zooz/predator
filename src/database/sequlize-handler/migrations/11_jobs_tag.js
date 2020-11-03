const Sequelize = require('sequelize');

module.exports.up = async (query, DataTypes) => {
    const jobsTable = await query.describeTable('jobs');

    if (!jobsTable.tag) {
        await query.addColumn(
            'jobs', 'tag',
            Sequelize.DataTypes.JSON);
    }
};

module.exports.down = async (query, DataTypes) => {
    await query.removeColumn('jobs', 'tag');
};
