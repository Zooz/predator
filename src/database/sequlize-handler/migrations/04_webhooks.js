const Sequelize = require('sequelize');
const uuid = require('uuid');
const { WEBHOOK_EVENT_TYPES } = require('../../../common/consts');

const tableName = 'webhooks';
const webhookEventsTableName = 'webhook_events';
const webhookEventMappingTableName = 'webhook_events';
const webhookJobsMappingTableName = 'webhook_job_mapping';
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

function createEnumRow(name) {
    return {
        name,
        id: uuid(),
        created_at: new Date(),
        updated_at: new Date()
    };
}

module.exports.up = async (query, DataTypes) => {
    let describedWebhooks = await query.describeTable(tableName);
    const webhooksEventTypes = WEBHOOK_EVENT_TYPES.map(createEnumRow);
    const promises = [
        ...columns.map(({ name, dt }) =>
            takeActionOnColumn(
                describedWebhooks,
                name,
                () => null,
                () => query.addColumn(tableName, name, dt)
            )
        )
    ];
    await Promise.all(promises);
    await query.bulkUpdate(tableName, { name: 'Webhook', global: false });
    await query.bulkInsert(webhookEventsTableName, webhooksEventTypes);
};

module.exports.down = async (query, DataTypes) => {
    const promises = [
        ...columns.map(({ name }) => query.removeColumn(tableName, name)),
        query.dropTable(webhookEventMappingTableName),
        query.dropTable(webhookEventsTableName),
        query.dropTable(webhookJobsMappingTableName)
    ];
    await Promise.all(promises);
};
