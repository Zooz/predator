const Sequelize = require('sequelize');
const uuid = require('uuid');

const { WEBHOOKS_EVENTS_MAPPING_TABLE_NAME, WEBHOOKS_EVENTS_TABLE_NAME, WEBHOOKS_JOBS_MAPPING_TABLE_NAME, WEBHOOKS_TABLE_NAME } = require('../consts');
const { WEBHOOK_EVENT_TYPES, EVENT_FORMAT_TYPE_SLACK } = require('../../../common/consts');

const columns = [
    {
        name: 'name',
        dt: Sequelize.DataTypes.TEXT('medium')
    },
    {
        name: 'global',
        dt: Sequelize.DataTypes.BOOLEAN
    },
    {
        name: 'format_type',
        dt: Sequelize.DataTypes.TEXT('medium')
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
    /*
        1. Create inexistent Tables
        2. Fill Enums
        3. add columns to webhooks
        4. Migrate data
        5. Drop job_id from webhooks
    */
    let describedWebhooks = await query.describeTable(WEBHOOKS_TABLE_NAME);
    // await migrateCurrentWebhooks(query, sequlizeClient);
    const webhooksEventTypes = WEBHOOK_EVENT_TYPES.map(createEnumRow);
    const promises = [
        ...columns.map(({ name, dt }) =>
            takeActionOnColumn(
                describedWebhooks,
                name,
                () => null,
                () => query.addColumn(WEBHOOKS_TABLE_NAME, name, dt)
            )
        )
    ];
    await Promise.all(promises);
    await query.bulkInsert(WEBHOOKS_EVENTS_TABLE_NAME, webhooksEventTypes);
    await query.bulkUpdate(WEBHOOKS_TABLE_NAME, { name: 'Migrated Webhook', global: false, format_type: EVENT_FORMAT_TYPE_SLACK });
    // create tables mapping
    // const eventIds = webhooksEventTypes.map(event => event.id);
    // Migrate data
    // const webhooksModel = sequlizeClient.model(WEBHOOKS_TABLE_NAME);
    // Assuming people didn't create tons of webhooks
    // const webhooks = await webhooksModel.findAll();
    // await Promise.all(webhooks.map(async webhook => {
    //     const webhookEventsAssociationRecords = eventIds.map(eventId => {
    //         return {
    //             created_at: new Date(),
    //             updated_at: new Date(),
    //             webhook_id: webhook.dataValues.id,
    //             webhook_event_id: eventId
    //         };
    //     });
    //     await query.bulkInsert(WEBHOOKS_EVENTS_MAPPING_TABLE_NAME, webhookEventsAssociationRecords);

    //     // const webhookJobAssociationRecord = {
    //     //     created_at: new Date(),
    //     //     updated_at: new Date(),
    //     //     webhook_id: webhook.id,
    //     //     job_id: webhook.job_id
    //     // };
    //     // await query.bulkInsert(WEBHOOKS_JOBS_MAPPING_TABLE_NAME, [webhookJobAssociationRecord]);
    // }));
    await takeActionOnColumn(
        describedWebhooks,
        'job_id',
        () => query.removeColumn(WEBHOOKS_TABLE_NAME, 'job_id'),
        () => null
    );
};

module.exports.down = async (query, DataTypes) => {
    const promises = [
        ...columns.map(({ name }) => query.removeColumn(WEBHOOKS_TABLE_NAME, name)),
        query.dropTable(WEBHOOKS_EVENTS_MAPPING_TABLE_NAME),
        query.dropTable(WEBHOOKS_EVENTS_TABLE_NAME),
        query.dropTable(WEBHOOKS_JOBS_MAPPING_TABLE_NAME)
    ];
    await Promise.all(promises);
};
