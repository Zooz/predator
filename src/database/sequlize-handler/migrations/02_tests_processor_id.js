const Sequelize = require('sequelize');

module.exports.up = async (query, DataTypes) => {
    let testsTable = await query.describeTable('tests');

    if (!testsTable.file_id) {
        await query.addColumn(
            'tests', 'processor_id',
            Sequelize.DataTypes.UUID);
    }
};

module.exports.down = async (query, DataTypes) => {
    await query.removeColumn('tests', 'processor_id');
};
