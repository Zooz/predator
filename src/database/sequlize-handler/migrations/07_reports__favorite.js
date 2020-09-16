const Sequelize = require('sequelize');

module.exports.up = async (query, DataTypes) => {
    let jobsTable = await query.describeTable('reports');

    if (!jobsTable.enabled) {
        await query.addColumn(
            'reports', 'is_favorite',
            Sequelize.DataTypes.BOOLEAN);
    }
};

module.exports.down = async (query, DataTypes) => {
    await query.removeColumn('reports', 'is_favorite');
};
