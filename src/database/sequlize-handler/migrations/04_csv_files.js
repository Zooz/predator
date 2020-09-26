const Sequelize = require('sequelize');

module.exports.up = async (query, DataTypes) => {
    const testsTable = await query.describeTable('tests');

    if (!testsTable.csv_file_id) {
        await query.addColumn(
            'tests', 'csv_file_id',
            Sequelize.DataTypes.UUID);
    }

    const filesTable = await query.describeTable('files');

    if (!filesTable.name) {
        await query.addColumn(
            'files', 'name',
            Sequelize.DataTypes.STRING);
    }
};

module.exports.down = async (query, DataTypes) => {
    await query.removeColumn('tests', 'csv_file_id');
    await query.removeColumn('files', 'name');
};
