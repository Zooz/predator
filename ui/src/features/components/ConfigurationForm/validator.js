import {isUndefined, get} from 'lodash'

import React from 'react';

export const validate = (state, objectKeys) => {
    const errors = customValidator(state);
    for (let objectKey of objectKeys) {
        const value = get(state, objectKey.key);
        if (!isUndefined(value)) {

            const validators = validatorsByKey[objectKey.key] || [];
            let firstError;
            validators.find((validator) => {
                firstError = validator(value, state);
                return firstError;
            });
            if (firstError) {
                errors[objectKey.key] = firstError;
            }
        }
    }
    return errors;
};

const validatorsByKey = {
    internal_address: [isRequired],
    runner_docker_image: [isRequired],
    runner_cpu: [isPositiveFloatNumberIfExist],
    runner_memory: [isPositiveIntegerNumberIfExist],
    minimum_wait_for_delayed_report_status_update_in_ms: [isPositiveIntegerNumberIfExist],
    delay_runner_ms: [isIntegerIfExist],
    interval_cleanup_finished_containers_ms: [isIntegerIfExist],
    benchmark_threshold: [isIntegerIfExist],
    ['smtp_server.port']: [isIntegerIfExist],
    ['smtp_server.timeout']: [isIntegerIfExist],
};


function customValidator(state) {
    return validateBenchmarkWeights(state.benchmark_weights);
}

function validateBenchmarkWeights(benchmarkWeights) {
    let errors = {};
    const entries = Object.entries(benchmarkWeights || {});
    for (let entry of entries) {
        const value = entry[1].percentage;
        const validateResult = isIntegerIfExist(value);
        if (validateResult) {
            errors[`benchmark_weights.${entry[0]}.percentage`] = validateResult;
        }
    }
    return errors;
}

function isRequired(value) {
    if (isUndefined(value) || value === '') {
        return 'Required field'
    }
}

function isPositiveIntegerNumberIfExist(value) {
    if (isUndefined(value)) {
        return;
    }

    if (!Number.isInteger(Number(value)) || Number(value) <= 0) {
        return 'Must be positive integer'
    }
}

function isPositiveFloatNumberIfExist(value) {
    if (isUndefined(value)) {
        return;
    }

    if (!Number(value)) {
        return 'Must be positive float';
    }

}

function isIntegerIfExist(value) {
    if (isUndefined(value)) {
        return;
    }

    if (!Number.isInteger(Number(value))) {
        return 'Must be a integer number';
    }
}
