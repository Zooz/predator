'use strict';

const Sequelize = require('sequelize');
const KUBEOBJECT = 'kubeObject';
let client;

module.exports = {
    init,
    getAllChaosExperiments,
    insertChaosExperiment,
    getChaosExperimentById,
    getChaosExperimentByName,
    deleteChaosExperiment
};

async function init(sequelizeClient) {
    client = sequelizeClient;
    await initSchemas();
}

async function insertChaosExperiment(experimentId, experiment, contextId) {
    const chaosExperimentModel = client.model('chaos-experiment');
    const params = {
        id: experimentId,
        name: experiment.name,
        kubeObject: experiment.kubeObject,
        created_at: Date.now(),
        updated_at: Date.now(),
        context_id: contextId
    };
    return chaosExperimentModel.create(params);
}

async function getAllChaosExperiments(from, limit, exclude, contextId) {
    const chaosExperimentModel = client.model('chaos-experiment');
    const attributes = {}, where = {};
    if (exclude && (exclude === KUBEOBJECT || exclude.includes(KUBEOBJECT))) {
        attributes.exclude = [`${KUBEOBJECT}`];
    }

    if (contextId) {
        where.context_id = contextId;
    }

    const allExperiments = chaosExperimentModel.findAll({ attributes, offset: from, limit, order: [['created_at', 'DESC']], where });
    return allExperiments;
}

async function _getChaosExperiment(options) {
    const chaosExperimentModel = client.model('chaos-experiment');
    const chaosExperiments = await chaosExperimentModel.findAll(options);
    return chaosExperiments[0];
}

async function getChaosExperimentById(experimentId, contextId) {
    const options = {
        where: { id: experimentId }
    };

    if (contextId) {
        options.where.context_id = contextId;
    }

    let chaosExperiment = await _getChaosExperiment(options);
    if (chaosExperiment) {
        chaosExperiment = chaosExperiment.get();
    }
    return chaosExperiment;
}

async function getChaosExperimentByName(experimentName, contextId) {
    const options = {
        where: { name: experimentName }
    };

    if (contextId) {
        options.where.context_id = contextId;
    }

    return _getChaosExperiment(options);
}

async function deleteChaosExperiment(processorId) {
    const chaosExperimentModel = client.model('chaos-experiment');
    const options = {
        where: {
            id: processorId
        }
    };

    return chaosExperimentModel.destroy(options);
}

async function initSchemas() {
    const chaosExperiments = client.define('chaos-experiment', {
        id: {
            type: Sequelize.DataTypes.UUID,
            primaryKey: true
        },
        name: {
            type: Sequelize.DataTypes.TEXT('medium')
        },
        kubeObject: {
            type: Sequelize.DataTypes.TEXT('JSON')
        },
        created_at: {
            type: Sequelize.DataTypes.DATE
        },
        updated_at: {
            type: Sequelize.DataTypes.DATE
        },
        context_id: {
            type: Sequelize.DataTypes.STRING
        }
    });
    await chaosExperiments.sync();
}
