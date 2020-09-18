const Sequelize = require('sequelize');

module.exports.up = async (query, DataTypes) => {
    let configTable = await query.describeTable('configs');

    if (configTable.value) {
        await query.changeColumn(
            'configs', 'value', {
                type: Sequelize.TEXT
            });
    }
};

module.exports.down = async (query, DataTypes) => {
};
