const Sequelize = require('sequelize');

module.exports.up = async (query) => {
    const reportsTable = await query.describeTable('reports');

    if (!reportsTable.results_summary) {
        await query.addColumn(
            'reports', 'results_summary',
            Sequelize.DataTypes.TEXT('long'));
    }
};

module.exports.down = async (query) => {
    await query.removeColumn('reports', 'results_summary');
};
