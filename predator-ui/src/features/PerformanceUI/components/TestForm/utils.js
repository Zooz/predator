import { cloneDeep } from 'lodash';
import { v4 as uuid } from 'uuid';

export const createTestRequest = (data) => {
  const { name, description, scenarios, type, baseUrl, before } = data;
  const scenariosRequest = scenarios.map((scenario) => {
    return {
      name: scenario.scenario_name,
      weight: scenario.weight,
      flow: prepareFlow(scenario.steps)
    }
  });
  return {
    name,
    description,
    type,
    artillery_test: {
      config: {
        target: baseUrl
      },
      before: before ? { steps: prepareFlow(before.steps) } : undefined,
      scenarios: scenariosRequest
    }
  }
};

export const createStateForEditTest = (test) => {
  test = cloneDeep(test);
  const { artillery_test } = test;
  return {
    name: test.name,
    description: test.description,
    id: test.id,
    baseUrl: artillery_test.config.target,
    before: testBeforeToStateBefore(artillery_test.before),
    scenarios: testScenarioToTestScenario(artillery_test.scenarios),
    type: 'custom'
  }
};

function testBeforeToStateBefore (before) {
  if (!before) {
    return;
  }
  return {
    steps: buildStepsFromFlow(before)
  }
}
function testScenarioToTestScenario (testScenarios) {
  return testScenarios.map((scenario) => {
    return {
      id: uuid(),
      scenario_name: scenario.name,
      weight: scenario.weight,
      steps: buildStepsFromFlow(scenario.flow)
    }
  })
}

function buildStepsFromFlow (flow) {
  return flow.map((request) => {
    const method = Object.keys(request)[0];
    return {
      id: uuid(),
      method: method.toUpperCase(),
      body: request[method].body,
      gzip: request[method].gzip,
      forever: request[method].forever,
      url: request[method].url,
      captures: buildCaptureState(request[method].capture),
      headers: buildHeadersState(request[method].headers)
    }
  })
}

function buildHeadersState (headers) {
  const keys = Object.keys(headers);
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
function buildCaptureState (captures) {
  if (!captures || captures.length === 0) {
    return [{}];
  }
  return captures.map((cur) => {
    return {
      key: cur.json,
      value: cur.as
    }
  })
}

function prepareFlow (steps) {
  return steps.map((step) => {
    return {
      [step.method.toLowerCase()]: {
        url: step.url,
        body: step.body,
        headers: prepareHeadersFromArray(step.headers),
        json: step.body,
        capture: prepareCapture(step.captures),
        gzip: step.gzip,
        forever: step.forever
      }
    }
  });
}
function prepareHeadersFromArray (headersArray) {
  const result = {};
  headersArray.forEach((headerObject) => {
    if (headerObject.key) {
      result[headerObject.key] = headerObject.value;
    }
  });
  return result;
}
function prepareCapture (captures) {
  const result = [];
  captures.forEach((captureObject) => {
    if (captureObject.key) {
      result.push({
        json: captureObject.key,
        as: captureObject.value
      });
    }
  });

  return result;
}
