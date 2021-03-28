const Sequelize = require('sequelize');

module.exports.up = async (query, DataTypes) => {
    const reportsTable = await query.describeTable('reports');

    if (!reportsTable.benchmark_weights_data) {
        await query.addColumn(
            'reports', 'benchmark_weights_data',
            Sequelize.DataTypes.TEXT('long'));
    }
    if (!reportsTable.score) {
        await query.addColumn(
            'reports', 'score',
            Sequelize.DataTypes.FLOAT);
    }
};

module.exports.down = async (query, DataTypes) => {
    await query.removeColumn('reports', 'benchmark_weights_data');
    await query.removeColumn('reports', 'score');
};
