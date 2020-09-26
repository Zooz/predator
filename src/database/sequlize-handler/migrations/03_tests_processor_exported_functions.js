const Sequelize = require('sequelize');

module.exports.up = async (query, DataTypes) => {
    const testsTable = await query.describeTable('processors');

    if (!testsTable.exported_functions) {
        await query.addColumn(
            'processors', 'exported_functions',
            Sequelize.DataTypes.STRING);
    }
};

module.exports.down = async (query, DataTypes) => {
    await query.removeColumn('processors', 'exported_functions');
};
