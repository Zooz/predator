const Sequelize = require('sequelize');

const {
    CONTEXT_ID
} = require('../../../common/consts');

const predatorTables = ['tests', 'jobs', 'reports', 'dsl_definitions', 'webhooks', 'files', 'processors'];

module.exports.up = async (query) => {
    for(const table of predatorTables) {
        const sequelizeTable = await query.describeTable(table);
        if (!sequelizeTable.context_id) {
            await query.addColumn(
                table, CONTEXT_ID,
                Sequelize.DataTypes.STRING);
        }
    }
};

module.exports.down = async (query) => {
    for(const table of predatorTables) {
        await query.removeColumn(table, CONTEXT_ID);
    }
};