
const Sequelize = require('sequelize'),
    uuid = require('uuid');

module.exports = {
    init,
    insertTest,
    getTest,
    getTests,
    deleteTest,
    getAllTestRevisions,
    saveFile,
    getFile,
    insertDslDefinition,
    getDslDefinitions,
    getDslDefinition,
    deleteDefinition,
    updateDslDefinition

};

let client;

async function init(sequlizeClient) {
    client = sequlizeClient;
    await initSchemas();
}

async function initSchemas() {
    const file = client.define('file', {
        id: {
            type: Sequelize.DataTypes.UUID,
            unique: 'compositeIndex'
        },
        file: {
            type: Sequelize.DataTypes.STRING
        }
    });
    const test = client.define('test', {
        test_id: {
            type: Sequelize.DataTypes.UUID,
            unique: 'compositeIndex'
        },
        file_id: {
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
    await test.sync();
    await dslDefinition.sync();
    await file.sync();
}

async function insertTest(testInfo, testJson, id, revisionId){
    const test = client.model('test');
    let params = {
        test_id: id,
        name: testInfo.name,
        type: testInfo.type,
        file: testInfo.fileId,
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
    let allTests = await test.findAll({ where: { test_id: id }, order: [['updated_at', 'DESC'], ['id', 'DESC']] });
    allTests = sanitizeTestResult(allTests);
    return allTests[0];
}
async function getTests() {
    const test = client.model('test');
    let allTests = await test.findAll({ order: [['updated_at', 'DESC'], ['id', 'DESC']] });
    allTests = sanitizeTestResult(allTests);
    return allTests;
}
async function getAllTestRevisions(id){
    const test = client.model('test');
    let allTests = await test.findAll({ where: { test_id: id }, order: [['updated_at', 'ASC'], ['id', 'ASC']] });
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
    let result = await dslDefinition.findAll({ where: { dsl_name: dslName, definition_name: definitionName } });
    result = sanitizeDslResult(result);
    return result[0];
}

async function getDslDefinitions(dslName){
    const dslDefinition = client.model('dsl_definition');
    let result = await dslDefinition.findAll({ where: { dsl_name: dslName } });
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

async function saveFile(id, file) {
    const fileClient = client.model('file');
    let params = {
        id: id,
        file: file
    };

    const result = fileClient.create(params);
    return result;
}

async function getFile(id) {
    const fileClient = client.model('file');
    const options = {
        attributes: { exclude: ['updated_at', 'created_at'] }
    };
    options.where = { id: id };
    const dbResult = await fileClient.find(options);
    return dbResult;
}

function sanitizeTestResult(data) {
    const result = data.map(function (test) {
        const dataValues = test.dataValues;
        dataValues.artillery_json = JSON.parse(dataValues.artillery_json);
        dataValues.raw_data = JSON.parse(dataValues.raw_data);
        dataValues.id = dataValues.test_id;
        delete dataValues.test_id;
        delete dataValues.created_at;
        return dataValues;
    });
    return result;
}
