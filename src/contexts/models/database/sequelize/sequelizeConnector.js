
const Sequelize = require('sequelize');
module.exports = {
    init,
    saveContext,
    getContexts,
    deleteContext
};

let client;

async function init(sequlizeClient) {
    client = sequlizeClient;
    await initSchemas();
}

async function initSchemas() {
    const context = client.define('context', {
        id: {
            type: Sequelize.DataTypes.UUID,
            primaryKey: true
        },
        name: {
            type: Sequelize.DataTypes.STRING,
            allowNull: false,
            unique: true
        }
    });
    await context.sync();
}

async function saveContext(id, contextName) {
    const contextClient = client.model('context');

    const duplicate = await contextClient.findOne({ where: { name: contextName } });
    if (duplicate) {
        throw Error('Duplicate context');
    }

    const params = {
        id: id,
        name: contextName
    };

    const result = contextClient.create(params);
    return result;
}

async function deleteContext(id) {
    const contextClient = client.model('context');

    const result = contextClient.destroy({ where: { id: id } });
    return result;
}

async function getContexts() {
    const contextClient = client.model('context');
    const options = {
        attributes: { exclude: ['updated_at', 'created_at'] }
    };

    const dbResult = await contextClient.findAll(options);
    return dbResult;
}
