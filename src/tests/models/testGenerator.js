'use strict';
const _ = require('lodash');
const { getContextId } = require('../../common/context/contextUtil');

const { TEST_TYPE_BASIC } = require('./../../common/consts');
const database = require('./database');
const utils = require('../helpers/utils');
const { get, cloneDeep } = require('lodash');

module.exports.createTest = async function(testDetails) {
    if (testDetails.type === TEST_TYPE_BASIC) {
        const artillery = utils.addDefaultsToTest(testDetails.artillery_test);
        delete testDetails.artillery_test;
        return artillery;
    } else {
        const dslCached = {};
        const scenarios = [];
        let weightsSum = 0;
        let missingWeightCount = 0;
        const variables = {};
        let before;
        if (testDetails.before && testDetails.before.steps){
            before = {};
            before.flow = await createSteps('before', testDetails.before.steps, variables, dslCached);
        }
        for (let i = 0; i < testDetails.scenarios.length; i++) {
            const scenario = testDetails.scenarios[i];
            const scenarioIndex = i;
            const artilleryTestJson = {};
            artilleryTestJson.name = scenario.scenario_name;
            artilleryTestJson.flow = await createSteps(scenarioIndex, scenario.steps, variables, dslCached);

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

        return addTestWrapper(scenarios, before, variables);
    }
};

function addTestWrapper(scenarios, before, variables) {
    const test = JSON.parse(JSON.stringify(require('./steps/testBase.json')));
    test.before = before;
    test.scenarios = scenarios;
    test.config.variables = Object.assign(test.config.variables, variables);
    return test;
}

function calculateWeights(scenarios, weightsSum, missingWeightCount) {
    const weight = (100 - weightsSum) / missingWeightCount;
    scenarios.forEach(function(scenario) {
        if (!scenario.weight) {
            scenario.weight = weight;
            weightsSum += weight;
        }
    });

    return weightsSum;
}

async function getDslDefinitionsAsMap(dslName) {
    const contextId = getContextId();

    const result = {};
    const definitions = await database.getDslDefinitions(dslName, contextId);
    definitions.forEach(function (definition) {
        result[definition.definition_name] = definition.artillery_json;
    });

    return result;
}

async function createSteps(majorPrefix, steps, variables, dslCached) {
    const stepsJsons = [];
    const previousSteps = [];
    for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const stepIndex = i;
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
            stepDefinition = {
                loop: [{
                    think: step.wait
                },
                stepDefinition
                ],
                count: 1
            };
        }

        if (step.properties && Object.keys(step.properties).length > 0) {
            insertPropertiesAsVars(majorPrefix, stepIndex, step.action, stepDefinition, Object.keys(step.properties));
            modifyVariablesArray(majorPrefix, stepIndex, step.action, variables, step.properties);
        }
        previousSteps.push(step.action);
        stepsJsons.push(stepDefinition);
    }

    return stepsJsons;
}

function insertPropertiesAsVars(majorPrefix, minorPrefix, stepName, stepDefinition, properties){
    const firstKey = Object.keys(stepDefinition)[0];
    properties.forEach(function(property) {
        const jsonBody = stepDefinition[firstKey].json;
        const propertyVariable = property.split('.').join('_');
        const newValue = '{{ ' + majorPrefix + '_' + minorPrefix + '_' + stepName + '_' + propertyVariable + ' }}';
        const updatedJsonBody = replaceValueInJsonBody(jsonBody, property, newValue);
        stepDefinition[firstKey].json = updatedJsonBody;
    });
}

function modifyVariablesArray(majorPrefix, minorPrefix, stepName, variables, properties) {
    Object.keys(properties).forEach(function(property) {
        const propertyAsVariableInFile = property.split('.').join('_');
        variables[majorPrefix + '_' + minorPrefix + '_' + stepName + '_' + propertyAsVariableInFile] = properties[property];
    });
}

function replaceValueInJsonBody(jsonBody, property, newValue) {
    _.set(jsonBody, property, newValue);
    return jsonBody;
}
