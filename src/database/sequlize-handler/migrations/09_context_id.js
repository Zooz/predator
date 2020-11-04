const Sequelize = require('sequelize');

const { CONTEXT_ID } = require('../../../common/consts'),
    logger = require('../../../common/logger');

const predatorTables = ['tests', 'jobs', 'reports', 'dsl_definitions', 'webhooks', 'files', 'processors', 'benchmarks'];

module.exports.up = async (query) => {
    for(const table of predatorTables) {
        const transaction = await query.sequelize.transaction();
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
        }

        await addIndex(query, table, transaction);

        await transaction.commit();
    } catch (err) {
        await transaction.rollback();
        throw err;
    }
}

async function addIndex(query, table, transaction) {
    try {
        await query.addIndex(
            table,
            [CONTEXT_ID], { transaction });
    } catch (err) {
        logger.warn(err, 'index already exists')
    }
}