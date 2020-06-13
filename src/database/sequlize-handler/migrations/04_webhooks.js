const Sequelize = require('sequelize');

const tableName = 'webhooks';
const columns = [
    {
        name: 'name',
        dt: Sequelize.DataTypes.TEXT('medium')
    },
    {
        name: 'global',
        dt: Sequelize.DataTypes.BOOLEAN
    }
];

async function takeActionOnColumn(describedTable, newColumnName, existAsyncAction, notExistAsyncAction) {
    if (describedTable[newColumnName]) {
        return existAsyncAction();
    }
    return notExistAsyncAction();
}

module.exports.up = async (query, DataTypes) => {
    let describedWebhooks = await query.describeTable(tableName);
    const promises = [
        ...columns.map(({ name, dt }) =>
            takeActionOnColumn(
                describedWebhooks,
                name,
                () => null,
                () => query.addColumn(tableName, name, dt)
            )
        ),
        takeActionOnColumn(describedWebhooks, 'url', () => query.renameColumn(tableName, 'url', 'webhook_url'), () => null)
    ];
    await Promise.all(promises);
    await query.bulkUpdate(tableName, { name: 'Webhook', global: false });
};

module.exports.down = async (query, DataTypes) => {
    const promises = [
        ...columns.map(({ name }) => query.removeColumn(tableName, name)),
        query.renameColumn(tableName, 'webhook_url', 'url'),
        query.dropTable('webhook_to_events'),
        query.dropTable('webhook_format_types')
    ];
    await Promise.all(promises);
};
