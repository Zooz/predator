'use strict';

const Sequelize = require('sequelize');
let client;

module.exports = {
    init,
    getAllProcessors
};

async function init(sequelizeClient) {
    client = sequelizeClient;
    await initSchemas();
}

async function getAllProcessors() {
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
    // const webhookToEventsMappingSchema = client.define('webhook_to_event', {
    //     type: Sequelize.DataTypes.INTEGER,
    //     primaryKey: true,
    //     autoIncrement: true
    // });

    // super many to many relation https://sequelize.org/master/manual/advanced-many-to-many.html

    await webhooksSchema.sync();
    await webhooksEvents.sync();
    webhooksSchema.belongsToMany(webhooksEvents, {
        through: 'webhookToEventsMappingSchema',
        as: 'webhooks',
        foreignKey: 'webhook_event_id'
    });
    webhooksEvents.belongsToMany(webhooksSchema, {
        through: 'webhook_event_mapping',
        as: 'webhook_events',
        foreignKey: 'webhook_id'
    });
    // await webhookToEventsMappingSchema.sync();
    // await webhooksSchema.sync();
    // await webhooksEvents.sync();
    // await webhookToEventsMappingSchema.sync();
}
