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
    return webhooksModel.findAll({ include: ['events'] });
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
    // super many to many relation https://sequelize.org/master/manual/advanced-many-to-many.html

    webhooksSchema.belongsToMany(webhooksEvents, {
        through: 'webhook_event_mapping',
        as: 'events',
        foreignKey: 'webhook_event_id'
    });
    webhooksEvents.belongsToMany(webhooksSchema, {
        through: 'webhook_event_mapping',
        as: 'webhooks',
        foreignKey: 'webhook_id'
    });

    await webhooksSchema.sync();
    await webhooksEvents.sync();
}
