
const Sequelize = require('sequelize'),
    uuid = require('uuid');
const sanitizeHelper = require('../../../helpers/sanitizeHelper');

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
    insertTestBenchMark

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
        }
    });

    const benchmarkDefinition = client.define('benchmark', {
        test_id: {
            type: Sequelize.DataTypes.UUID,
            primaryKey: true
        },
        data: {
            type: Sequelize.DataTypes.STRING
        }
    });
    await test.sync();
    await dslDefinition.sync();
    await benchmarkDefinition.sync();
}

async function insertTestBenchMark(testId, benchMarkData) {
    const benchmark = client.model('benchmark');
    let params = {
        test_id: testId,
        data: benchMarkData
    };
    const result = benchmark.create(params);
    return result;
}

async function insertTest(testInfo, testJson, id, revisionId, processorFileId, csvFileId){
    const test = client.model('test');
    let params = {
        test_id: id,
        name: testInfo.name,
        type: testInfo.type,
        file_id: processorFileId,
        csv_file_id: csvFileId,
        processor_id: testInfo.processor_id,
        description: testInfo.description,
        updated_at: Date.now(),
        raw_data: JSON.stringify(testInfo),
        artillery_json: JSON.stringify(testJson),
        revision_id: revisionId
    };

    const result = test.create(params);
    return result;
}

async function getTest(id) {
    const test = client.model('test');
    const options = {
        attributes: { exclude: ['created_at'] },
        where: { test_id: id },
        order: [['updated_at', 'DESC'], ['id', 'DESC']]
    };
    let allTests = await test.findAll(options);
    allTests = sanitizeTestResult(allTests);
    return allTests[0];
}
async function getTests() {
    const test = client.model('test');
    const options = {
        attributes: { exclude: ['created_at'] },
        order: [['updated_at', 'DESC'], ['id', 'DESC']]
    };
    let allTests = await test.findAll(options);
    allTests = sanitizeTestResult(allTests);
    return allTests;
}
async function getAllTestRevisions(id){
    const test = client.model('test');
    const options = {
        attributes: { exclude: ['created_at'] },
        where: { test_id: id },
        order: [['updated_at', 'ASC'], ['id', 'ASC']]
    };
    let allTests = await test.findAll(options);
    allTests = sanitizeTestResult(allTests);
    return allTests;
}

async function deleteTest(testId){
    const test = client.model('test');
    const result = test.destroy(
        {
            where: { test_id: testId }
        });
    return result;
}

async function insertDslDefinition(dslName, definitionName, data){
    const dslDefinition = client.model('dsl_definition');
    let params = {
        id: uuid.v4(),
        dsl_name: dslName,
        definition_name: definitionName,
        artillery_json: JSON.stringify(data)
    };
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
    const dslDefinition = client.model('dsl_definition');
    const options = {
        attributes: { exclude: ['updated_at', 'created_at'] },
        where: { dsl_name: dslName, definition_name: definitionName }
    };
    let result = await dslDefinition.findAll(options);
    result = sanitizeDslResult(result);
    return result[0];
}

async function getDslDefinitions(dslName){
    const dslDefinition = client.model('dsl_definition');
    const options = {
        attributes: { exclude: ['updated_at', 'created_at'] },
        where: { dsl_name: dslName }
    };
    let result = await dslDefinition.findAll(options);
    result = sanitizeDslResult(result);
    return result;
}

async function updateDslDefinition(dslName, definitionName, data){
    const dslDefinition = client.model('dsl_definition');
    let params = {
        dsl_name: dslName,
        definition_name: definitionName,
        artillery_json: JSON.stringify(data)
    };
    const result = await dslDefinition.update(params, { where: { dsl_name: dslName, definition_name: definitionName } });
    return result[0] === 1;
}
async function deleteDefinition(dslName, definitionName){
    const dslDefinition = client.model('dsl_definition');
    const result = await dslDefinition.destroy({ where: { dsl_name: dslName, definition_name: definitionName } });
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
        dataValues.artillery_json = JSON.parse(dataValues.artillery_json);
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
