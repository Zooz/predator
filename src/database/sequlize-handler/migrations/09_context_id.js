const Sequelize = require('sequelize');

const {
    CONTEXT_ID
} = require('../../../common/consts');

const predatorTables = ['tests', 'jobs', 'reports', 'dsl_definitions', 'webhooks', 'files', 'processors', 'benchmarks'];

module.exports.up = async (query) => {
    const transaction = await query.sequelize.transaction();
    for(const table of predatorTables) {
        await migrateTable(query, table, transaction);
    }
};

module.exports.down = async (query) => {

};

async function migrateTable(query, table, transaction) {
    const sequelizeTable = await query.describeTable(table);
    try {
        if (!sequelizeTable.context_id) {
            await query.addColumn(
                table,
                CONTEXT_ID,
                Sequelize.DataTypes.STRING, { transaction });
            await query.addIndex(
                table,
                [CONTEXT_ID], { transaction });

            await transaction.commit();
            transaction = null;
        }
    } catch (err) {
        await transaction.rollback();
        throw err;
    }
}