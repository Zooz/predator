import {isUndefined} from 'lodash'
import cronstrue from 'cronstrue';
import {testTypes} from './constants';

import React from 'react';

export const validate = (state) => {
    const errors = {};
    Object.keys(validatorsByKey)
        .forEach((field) => {
            const validators = validatorsByKey[field];
            let firstError;
            if (skipValidation[field] && skipValidation[field](state)) {
                //skip
                return;
            }
            validators.find((validator) => {
                firstError = validator(state[field], state);
                return firstError;
            });
            if (firstError) {
                errors[field] = firstError;
            }
        });
    return errors;
};

const skipValidation = {
    arrival_rate: (state) => {
        return state.type === testTypes.FUNCTIONAL_TEST
    },
    arrival_count: (state) => {
        return state.type === testTypes.LOAD_TEST
    },
    ramp_to: (state) => {
        return state.type === testTypes.FUNCTIONAL_TEST
    }
};

const validatorsByKey = {
    arrival_rate: [isRequired, isPositiveIntegerNumberIfExist],
    arrival_count: [isRequired, isPositiveIntegerNumberIfExist],
    duration: [isRequired, isPositiveIntegerNumberIfExist],
    ramp_to: [rampToValidator],
    parallelism: [isPositiveIntegerNumberIfExist],
    max_virtual_users: [isPositiveIntegerNumberIfExist],
    cron_expression: [cronValidator],
    emails: [emailsValidator]
};

function isRequired(value, allState) {
    if (isUndefined(value) || value === '') {
        return 'Required field'
    }
}

function isPositiveIntegerNumberIfExist(value, allState) {
    if (isUndefined(value)) {
        return;
    }

    if (!Number.isInteger(Number(value)) || Number(value) <= 0) {
        return 'Must be positive number'
    }
}

function rampToValidator(value, allState) {
    if (isUndefined(value)) {
        return;
    }
    const isPositiveNumber = isPositiveIntegerNumberIfExist(value);
    if (isPositiveNumber) {
        return isPositiveNumber;
    }
    if (Number.isInteger(Number(allState.arrival_rate)) && Number(value) < Number(allState.arrival_rate)) {
        return 'Must be bigger than arrival rate'
    }
}

function cronValidator(value, allState) {
    if (isRequired(value) && !allState.run_immediately) {
        return 'Required if run immediately is unchecked'
    }
    if (value) {
        try {
            cronstrue.toString(value)
        } catch (err) {
            return 'illegal cron input'
        }
    }
}

function emailsValidator() {
    // TODO
}
