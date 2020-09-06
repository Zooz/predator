import {cloneDeep} from 'lodash';
import {v4 as uuid} from 'uuid';
import {CONTENT_TYPES,CAPTURE_TYPE_TO_REQUEST,CAPTURE_RES_TYPE_TO_CAPTURE_TYPE} from './constants';

const SLEEP = 'sleep';
export const createTestRequest = (data) => {
    const {name, description, scenarios, type, baseUrl, before, processorId, csvFileId} = data;
    const scenariosRequest = scenarios.map((scenario) => {
        return {
            name: scenario.scenario_name,
            weight: scenario.weight,
            beforeScenario: scenario.beforeScenario,
            afterScenario: scenario.afterScenario,
            flow: prepareFlow(scenario.steps),
        }
    });
    return {
        name,
        description,
        type,
        processor_id: processorId,
        artillery_test: {
            config: {
                target: baseUrl
            },
            before: before ? {flow: prepareFlow(before.steps)} : undefined,
            scenarios: scenariosRequest
        },
        csv_file_id: csvFileId
    }
};

export const createStateForEditTest = (test, cloneMode) => {
    test = cloneDeep(test);
    const {artillery_test} = test;
    const scenarios = testScenarioToTestScenario(artillery_test.scenarios);
    return {
        name: test.name,
        description: test.description,
        id: test.id,
        baseUrl: artillery_test.config.target,
        before: testBeforeToStateBefore(artillery_test.before),
        scenarios: scenarios,
        activeTabKey: scenarios[0] && scenarios[0].id,
        type: test.type,
        processorId: test.processor_id,
        editMode: !cloneMode,
        processorsExportedFunctions: [],
        csvFileId: test.csv_file_id
    }

};

function testBeforeToStateBefore(before) {
    if (!before) {
        return;
    }
    return {
        scenario_name: 'Before',
        isBefore: true,
        id: uuid(),
        steps: buildStepsFromFlow(before.flow)
    }
}

function testScenarioToTestScenario(testScenarios) {
    if (!testScenarios) {
        return []
    }
    return testScenarios.map((scenario) => {
        return {
            id: uuid(),
            scenario_name: scenario.name,
            beforeScenario: scenario.beforeScenario,
            afterScenario: scenario.afterScenario,
            weight: scenario.weight,
            steps: buildStepsFromFlow(scenario.flow)
        }
    })
}

function buildStepsFromFlow(flow) {
    if (!flow) {
        return []
    }
    return flow.map((request) => {
        const action = Object.keys(request)[0];
        if (action.toLowerCase() === 'think') {
            return {
                type: SLEEP,
                sleep: request.think
            }
        }
        return {
            type: 'http',
            id: uuid(),
            method: action.toUpperCase(),
            body: request[action].json || request[action].body || request[action].form,
            gzip: request[action].gzip,
            forever: request[action].forever,
            url: request[action].url,
            beforeRequest: request[action].beforeRequest,
            afterResponse: request[action].afterResponse,
            captures: buildCaptureState(request[action].capture),
            headers: buildHeadersState(request[action].headers),
            contentType: (request[action].json && CONTENT_TYPES.APPLICATION_JSON) || (request[action].form && CONTENT_TYPES.FORM) || CONTENT_TYPES.OTHER
        }
    })
}

function buildHeadersState(headers) {
    const keys = headers ? Object.keys(headers) : [];
    const result = keys.map((key) => {
        return {
            key: key,
            value: headers[key]
        }
    });
    if (result.length === 0) {
        result.push({});
    }
    return result;
}

function buildCaptureState(captures) {
    if (!captures || captures.length === 0) {
        return [{}];
    }
    return captures.map((cur) => {
        return {
            key: cur.json || cur.xpath,
            value: cur.as,
            type: (cur.json && CAPTURE_RES_TYPE_TO_CAPTURE_TYPE.json) || (cur.xpath && CAPTURE_RES_TYPE_TO_CAPTURE_TYPE.xpath)
        }
    })
}

function prepareFlow(steps) {
    console.log('prepare steps',steps)
    return steps.map((step) => {
        if (step.type === SLEEP) {
            return {
                think: step.sleep
            }
        }

        return {
            [step.method.toLowerCase()]: {
                url: step.url,
                headers: prepareHeadersFromArray(step.headers),
                json: step.contentType === CONTENT_TYPES.APPLICATION_JSON ? step.body : undefined,
                body: step.contentType === CONTENT_TYPES.OTHER ? step.body : undefined,
                form: step.contentType === CONTENT_TYPES.FORM ? step.body : undefined,
                capture: prepareCapture(step.captures),
                gzip: step.gzip,
                forever: step.forever,
                beforeRequest: step.beforeRequest,
                afterResponse: step.afterResponse
            }
        }
    });
}

function prepareHeadersFromArray(headersArray) {
    const result = {};
    headersArray.forEach((headerObject) => {
        if (headerObject.key) {
            result[headerObject.key] = headerObject.value;
        }
    });
    return result;
}

function prepareCapture(captures) {
    const result = [];
    captures.forEach((captureObject) => {
        if (captureObject.key) {
            result.push({
                [CAPTURE_TYPE_TO_REQUEST[captureObject.type]]: captureObject.key,
                as: captureObject.value
            });
        }
    });

    return result;
}
