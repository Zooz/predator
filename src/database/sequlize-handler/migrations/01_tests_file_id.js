const Sequelize = require('sequelize');

module.exports.up = async (query, DataTypes) => {
    const testsTable = await query.describeTable('tests');

    if (!testsTable.file_id) {
        await query.addColumn(
            'tests', 'file_id',
            Sequelize.DataTypes.UUID);
    }
};

module.exports.down = async (query, DataTypes) => {
    await query.removeColumn('tests', 'file_id');
};
