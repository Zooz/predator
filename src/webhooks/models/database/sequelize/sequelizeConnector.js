'use strict';

const Sequelize = require('sequelize');
let client;

module.exports = {
    init,
    getAllWebhooks
};

async function init(sequelizeClient) {
    client = sequelizeClient;
    await initSchemas();
}

async function getAllWebhooks() {
    const webhooksModel = client.model('webhook');
    return webhooksModel.findAll();
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
        webhook_url: {
            type: Sequelize.DataTypes.STRING
        },
        global: {
            type: Sequelize.DataTypes.BOOLEAN
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
    const webhookFormatTypes = client.define('webhook_format_type', {
        id: {
            type: Sequelize.DataTypes.UUID,
            primaryKey: true
        },
        name: {
            type: Sequelize.DataTypes.TEXT('medium')
        }
    });
    // super many to many relation https://sequelize.org/master/manual/advanced-many-to-many.html

    webhooksSchema.belongsToMany(webhooksEvents, {
        through: 'webhook_event_mapping',
        as: 'webhooks',
        foreignKey: 'webhook_event_id'
    });
    webhooksEvents.belongsToMany(webhooksSchema, {
        through: 'webhook_event_mapping',
        as: 'webhook_events',
        foreignKey: 'webhook_id'
    });

    webhooksSchema.belongsTo(webhookFormatTypes, {
        foreignKey: 'webhook_format_type_id',
        as: 'webhook_format_type'
    });
    await webhookFormatTypes.sync();
    await webhooksSchema.sync();
    await webhooksEvents.sync();
}
