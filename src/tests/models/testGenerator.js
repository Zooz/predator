'use strict';
let _ = require('lodash');
let consts = require('./../../common/consts');
const database = require('./database');
const { get, cloneDeep } = require('lodash');

module.exports.createTest = async function(testDetails) {
    if (testDetails.type === consts.TEST_TYPE_CUSTOM) {
        let artillery = testDetails.artillery_test;
        delete testDetails.artillery_test;
        return artillery;
    } else {
        let scenarios = [];
        let weightsSum = 0;
        let missingWeightCount = 0;
        let variables = {};

        for (let i = 0; i < testDetails.scenarios.length; i++) {
            let scenario = testDetails.scenarios[i];
            let scenarioIndex = i;
            let artilleryTestJson = {};
            artilleryTestJson.name = scenario.scenario_name;
            artilleryTestJson.flow = await createSteps(scenarioIndex, scenario.steps, variables);

            if (scenario.weight) {
                weightsSum += scenario.weight;
                if (weightsSum > 100) {
                    const error = new Error('Weights cannot sum up to more than 100%');
                    error.statusCode = 422;
                    throw error;
                }
                artilleryTestJson.weight = scenario.weight;
            } else {
                missingWeightCount++;
            }

            scenarios.push(artilleryTestJson);
        }

        if (missingWeightCount !== 0) {
            weightsSum = calculateWeights(scenarios, weightsSum, missingWeightCount);
        }

        if (weightsSum !== 100) {
            const error = new Error('Weights do not sum up to 100%');
            error.statusCode = 422;
            throw error;
        }

        return addTestWrapper(scenarios, variables);
    }
};

function addTestWrapper(scenarios, variables) {
    let test = JSON.parse(JSON.stringify(require('./steps/testBase.json')));
    test.scenarios = scenarios;
    test.config.variables = Object.assign(test.config.variables, variables);
    return test;
}

function calculateWeights(scenarios, weightsSum, missingWeightCount) {
    let weight = (100 - weightsSum) / missingWeightCount;
    scenarios.forEach(function(scenario) {
        if (!scenario.weight) {
            scenario.weight = weight;
            weightsSum += weight;
        }
    });

    return weightsSum;
}

async function getDslDefinitionsAsMap(dslName) {
    const result = {};
    const definitions = await database.getDslDefinitions(dslName);
    definitions.forEach(function (definition) {
        result[definition.definition_name] = definition.artillery_json;
    });

    return result;
}

async function createSteps(scenarioIndex, steps, variables) {
    let stepsJsons = [];
    let previousSteps = [];
    const dslCached = {};
    for (let i = 0; i < steps.length; i++) {
        let step = steps[i];
        let stepIndex = i;
        const parsedAction = step.action.split('.');
        if (parsedAction.length !== 2){
            const error = new Error('action must be this pattern: {dsl_name}.{definition_name}.');
            error.statusCode = 400;
            throw error;
        }
        const dslName = parsedAction[0];
        const dslDefinition = parsedAction[1];
        if (!dslCached[dslName]) {
            dslCached[dslName] = await getDslDefinitionsAsMap(dslName);
        }

        let stepDefinition = get(dslCached, `[${dslName}][${dslDefinition}]`);
        if (!stepDefinition){
            const error = new Error(`${step.action}: dsl name or dsl definition does not exist.`);
            error.statusCode = 400;
            throw error;
        }
        stepDefinition = cloneDeep(stepDefinition);
        if (step.wait) {
            stepDefinition = { loop: [ {
                think: step.wait
            },
            stepDefinition
            ],
            count: 1 };
        }

        if (step.properties && Object.keys(step.properties).length > 0) {
            insertPropertiesAsVars(scenarioIndex, stepIndex, step.action, stepDefinition, Object.keys(step.properties));
            modifyVariablesArray(scenarioIndex, stepIndex, step.action, variables, step.properties);
        }
        previousSteps.push(step.action);
        stepsJsons.push(stepDefinition);
    }

    return stepsJsons;
}

function insertPropertiesAsVars(scenarioIndex, stepIndex, stepName, stepDefinition, properties){
    let firstKey = Object.keys(stepDefinition)[0];
    properties.forEach(function(property) {
        let jsonBody = stepDefinition[firstKey]['json'];
        let propertyVariable = property.split('.').join('_');
        let newValue = '{{ ' + scenarioIndex + '_' + stepIndex + '_' + stepName + '_' + propertyVariable + ' }}';
        let updatedJsonBody = replaceValueInJsonBody(jsonBody, property, newValue);
        stepDefinition[firstKey]['json'] = updatedJsonBody;
    });
}

function modifyVariablesArray(scenarioIndex, stepIndex, stepName, variables, properties) {
    Object.keys(properties).forEach(function(property) {
        let propertyAsVariableInFile = property.split('.').join('_');
        variables[scenarioIndex + '_' + stepIndex + '_' + stepName + '_' + propertyAsVariableInFile] = properties[property];
    });
}

function replaceValueInJsonBody(jsonBody, property, newValue) {
    _.set(jsonBody, property, newValue);
    return jsonBody;
}
