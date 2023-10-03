const Sequelize = require('sequelize');

module.exports.up = async (query, DataTypes) => {
    const jobsTable = await query.describeTable('jobs');

    if (!jobsTable.experiments) {
        await query.addColumn(
            'jobs', 'experiments',
            Sequelize.DataTypes.JSON); // stringified array
    }
};

module.exports.down = async (query, DataTypes) => {
    await query.removeColumn('jobs', 'experiments');
};
