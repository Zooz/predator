const Sequelize = require('sequelize');

module.exports.up = async (query, DataTypes) => {
    let jobsTable = await query.describeTable('tests');

    if (!jobsTable.enabled) {
        await query.addColumn(
            'tests', 'is_favorite',
            Sequelize.DataTypes.BOOLEAN);
    }
};

module.exports.down = async (query, DataTypes) => {
    await query.removeColumn('tests', 'is_favorite');
};
