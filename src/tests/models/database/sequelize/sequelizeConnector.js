
const Sequelize = require('sequelize'),
    uuid = require('uuid'),
    httpContext = require('express-http-context');
const sanitizeHelper = require('../../../helpers/sanitizeHelper'),
    {
        CONTEXT_ID
    } = require('../../../../common/consts');

module.exports = {
    init,
    insertTest,
    getTest,
    getTests,
    deleteTest,
    getAllTestRevisions,
    insertDslDefinition,
    getDslDefinitions,
    getDslDefinition,
    deleteDefinition,
    updateDslDefinition,
    insertTestBenchmark,
    getTestBenchmark

};

let client;

async function init(sequlizeClient) {
    client = sequlizeClient;
    await initSchemas();
}

async function initSchemas() {
    const test = client.define('test', {
        test_id: {
            type: Sequelize.DataTypes.UUID,
            unique: 'compositeIndex'
        },
        file_id: {
            type: Sequelize.DataTypes.UUID
        },
        csv_file_id: {
            type: Sequelize.DataTypes.UUID
        },
        processor_id: {
            type: Sequelize.DataTypes.UUID
        },
        name: {
            type: Sequelize.DataTypes.STRING
        },
        description: {
            type: Sequelize.DataTypes.STRING
        },
        type: {
            type: Sequelize.DataTypes.STRING
        },
        updated_at: {
            type: Sequelize.DataTypes.DATE
        },
        raw_data: {
            type: Sequelize.DataTypes.TEXT('long')
        },
        artillery_json: {
            type: Sequelize.DataTypes.TEXT('long')
        },
        revision_id: {
            type: Sequelize.DataTypes.UUID,
            unique: 'compositeIndex'
        },
        context_id: {
            type: Sequelize.DataTypes.STRING
        }
    });

    const dslDefinition = client.define('dsl_definition', {
        id: {
            type: Sequelize.DataTypes.UUID,
            primaryKey: true
        },
        dsl_name: {
            type: Sequelize.DataTypes.STRING,
            unique: 'compositeIndex'
        },
        definition_name: {
            type: Sequelize.DataTypes.STRING,
            unique: 'compositeIndex'
        },
        artillery_json: {
            type: Sequelize.DataTypes.TEXT('long')
        },
        context_id: {
            type: Sequelize.DataTypes.STRING
        }
    });

    const benchmarkDefinition = client.define('benchmark', {
        test_id: {
            type: Sequelize.DataTypes.UUID,
            primaryKey: true
        },
        data: {
            type: Sequelize.DataTypes.STRING
        },
        context_id: {
            type: Sequelize.DataTypes.STRING
        }
    });
    await test.sync();
    await dslDefinition.sync();
    await benchmarkDefinition.sync();
}

async function insertTestBenchmark(testId, benchmarkData) {
    const contextId = httpContext.get(CONTEXT_ID);

    const benchmark = client.model('benchmark');
    const params = {
        test_id: testId,
        data: benchmarkData
    };

    if (contextId) {
        params.context_id = contextId;
    }

    const result = benchmark.create(params);
    return result;
}

async function getTestBenchmark(test_id) {
    const contextId = httpContext.get(CONTEXT_ID);

    const benchmark = client.model('benchmark');
    const options = {
        where: { test_id: test_id }
    };

    if (contextId) {
        options.where.context_id = contextId;
    }

    const benchmarkRes = await benchmark.findOne(options);
    return benchmarkRes ? benchmarkRes.data : undefined;
}

async function insertTest(testInfo, testJson, id, revisionId, processorFileId){
    const contextId = httpContext.get(CONTEXT_ID);

    const test = client.model('test');
    const params = {
        test_id: id,
        name: testInfo.name,
        type: testInfo.type,
        file_id: processorFileId,
        csv_file_id: testInfo.csv_file_id,
        processor_id: testInfo.processor_id,
        description: testInfo.description,
        updated_at: Date.now(),
        raw_data: JSON.stringify(testInfo),
        artillery_json: JSON.stringify(testJson),
        revision_id: revisionId
    };

    if (contextId) {
        params.context_id = contextId;
    }

    const result = test.create(params);
    return result;
}

async function getTest(id) {
    const contextId = httpContext.get(CONTEXT_ID);
    const test = client.model('test');
    const options = {
        attributes: { exclude: ['created_at'] },
        where: { test_id: id },
        order: [['updated_at', 'DESC'], ['id', 'DESC']]
    };

    if (contextId) {
        options.where.context_id = contextId;
    }

    let allTests = await test.findAll(options);
    allTests = sanitizeTestResult(allTests);
    return allTests[0];
}

async function getTests() {
    const contextId = httpContext.get(CONTEXT_ID);

    const test = client.model('test');
    const options = {
        attributes: { exclude: ['created_at'] },
        order: [['updated_at', 'DESC'], ['id', 'DESC']]
    };

    if (contextId) {
        options.where = { context_id: contextId };
    }

    let allTests = await test.findAll(options);
    allTests = sanitizeTestResult(allTests);
    return allTests;
}
async function getAllTestRevisions(id){
    const contextId = httpContext.get(CONTEXT_ID);

    const test = client.model('test');
    const options = {
        attributes: { exclude: ['created_at'] },
        where: { test_id: id },
        order: [['updated_at', 'ASC'], ['id', 'ASC']]
    };

    if (contextId) {
        options.where.context_id = contextId;
    }

    let allTests = await test.findAll(options);
    allTests = sanitizeTestResult(allTests);
    return allTests;
}

async function deleteTest(testId){
    const contextId = httpContext.get(CONTEXT_ID);

    const test = client.model('test');
    const options = {
        where: { test_id: testId }
    };

    if (contextId) {
        options.where.context_id = contextId;
    }

    const result = test.destroy(options);
    return result;
}

async function insertDslDefinition(dslName, definitionName, data){
    const contextId = httpContext.get(CONTEXT_ID);

    const dslDefinition = client.model('dsl_definition');
    const params = {
        id: uuid.v4(),
        dsl_name: dslName,
        definition_name: definitionName,
        artillery_json: JSON.stringify(data)
    };

    if (contextId) {
        params.context_id = contextId;
    }

    try {
        await dslDefinition.create(params);
        return true;
    } catch (err){
        if (err.message === 'Validation error'){
            return false;
        }
        throw err;
    }
}

async function getDslDefinition(dslName, definitionName){
    const contextId = httpContext.get(CONTEXT_ID);

    const dslDefinition = client.model('dsl_definition');
    const options = {
        attributes: { exclude: ['updated_at', 'created_at'] },
        where: { dsl_name: dslName, definition_name: definitionName }
    };

    if (contextId) {
        options.where.context_id = contextId;
    }

    let result = await dslDefinition.findAll(options);
    result = sanitizeDslResult(result);
    return result[0];
}

async function getDslDefinitions(dslName){
    const contextId = httpContext.get(CONTEXT_ID);

    const dslDefinition = client.model('dsl_definition');
    const options = {
        attributes: { exclude: ['updated_at', 'created_at'] },
        where: { dsl_name: dslName }
    };

    if (contextId) {
        options.where.context_id = contextId;
    }

    let result = await dslDefinition.findAll(options);
    result = sanitizeDslResult(result);
    return result;
}

async function updateDslDefinition(dslName, definitionName, data){
    const contextId = httpContext.get(CONTEXT_ID);

    const dslDefinition = client.model('dsl_definition');
    const params = {
        dsl_name: dslName,
        definition_name: definitionName,
        artillery_json: JSON.stringify(data)
    };

    const options = {
        where: {
            dsl_name: dslName,
            definition_name: definitionName
        }
    }

    if (contextId) {
        options.where.context_id = contextId;
    }

    const result = await dslDefinition.update(params, options);
    return result[0] === 1;
}
async function deleteDefinition(dslName, definitionName){
    const contextId = httpContext.get(CONTEXT_ID);

    const options = {
        where: {
            dsl_name: dslName,
            definition_name: definitionName
        }
    }

    if (contextId) {
        options.where.context_id = contextId;
    }

    const dslDefinition = client.model('dsl_definition');
    const result = await dslDefinition.destroy(options);
    return result;
}

function sanitizeDslResult(data) {
    const result = data.map(function (dslDefinition) {
        const dataValues = dslDefinition.dataValues;
        dataValues.artillery_json = JSON.parse(dataValues.artillery_json);
        return dataValues;
    });
    return result;
}

function sanitizeTestResult(data) {
    const result = data.map(function (test) {
        const dataValues = test.dataValues;
        const dslDataObject = sanitizeHelper.extractDslRootData(dataValues.raw_data);
        dataValues.artillery_json = dataValues.artillery_json ? JSON.parse(dataValues.artillery_json) : undefined;
        dataValues.id = dataValues.test_id;
        dataValues.file_id = dataValues.file_id || undefined;
        dataValues.csv_file_id = dataValues.csv_file_id || undefined;
        dataValues.processor_id = dataValues.processor_id || undefined;
        delete dataValues.raw_data;
        delete dataValues.test_id;
        return Object.assign(dataValues, dslDataObject);
    });
    return result;
}