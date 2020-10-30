const Sequelize = require('sequelize');

module.exports.up = async (query, DataTypes) => {
    const testsTable = await query.describeTable('tests');

    if (!testsTable.is_favorite) {
        await query.addColumn(
            'tests', 'is_favorite',
            Sequelize.DataTypes.BOOLEAN);
    }
};

module.exports.down = async (query, DataTypes) => {
    await query.removeColumn('tests', 'is_favorite');
};
