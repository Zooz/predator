'use strict';

const Sequelize = require('sequelize');
const uuid = require('uuid');

let client;

module.exports = {
    init,
    getAllWebhooks,
    createWebhook
};

async function init(sequelizeClient) {
    client = sequelizeClient;
    await initSchemas();
}

async function getAllWebhooks() {
    const webhooksModel = client.model('webhook');
    return webhooksModel.findAll({ include: ['events'] });
}

async function createWebhook(webhook) {
    const id = uuid.v4();
    const webhooksModel = client.model('webhook');
    const webhooksEvents = client.model('webhook_event');
    const events = await webhooksEvents.findAll({ where: { name: webhook.events } });
    const eventsIds = events.map(({ id }) => id);
    const meow = {
        id,
        name: webhook.name,
        url: webhook.url,
        format_type: webhook.format_type,
        global: webhook.global
    };
    await client.transaction(async function(transaction) {
        const createdWebhook = await webhooksModel.create(meow, { transaction });
        await createdWebhook.setEvents(eventsIds, { transaction });
        return createdWebhook;
    });
    return webhooksModel.findByPk(id, { include: ['events'] });
}

async function initSchemas() {
    const webhooksSchema = client.define('webhook', {
        id: {
            type: Sequelize.DataTypes.UUID,
            primaryKey: true
        },
        name: {
            type: Sequelize.DataTypes.TEXT('medium')
        },
        url: {
            type: Sequelize.DataTypes.STRING
        },
        global: {
            type: Sequelize.DataTypes.BOOLEAN
        },
        format_type: {
            type: Sequelize.DataTypes.STRING
        },
        created_at: {
            type: Sequelize.DataTypes.DATE
        },
        updated_at: {
            type: Sequelize.DataTypes.DATE
        }
    });
    const webhooksEvents = client.define('webhook_event', {
        id: {
            type: Sequelize.DataTypes.UUID,
            primaryKey: true
        },
        name: {
            type: Sequelize.DataTypes.TEXT('medium')
        }
    });

    webhooksSchema.belongsToMany(webhooksEvents, {
        through: 'webhook_event_mapping',
        as: 'events',
        foreignKey: 'webhook_id'
    });
    webhooksEvents.belongsToMany(webhooksSchema, {
        through: 'webhook_event_mapping',
        as: 'webhooks',
        foreignKey: 'webhook_event_id'
    });

    await webhooksSchema.sync();
    await webhooksEvents.sync();
}
