import { isUndefined } from 'lodash'

import React from 'react';

export const validate = (state) => {
  const errors = {};
  Object.keys(validatorsByKey)
    .forEach((field) => {
      const validators = validatorsByKey[field];
      let firstError;
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

const validatorsByKey = {
  internal_address: [isRequired],
  runner_docker_image: [isRequired],
  runner_cpu: [isPositiveFloatNumberIfExist],
  runner_memory: [isPositiveIntegerNumberIfExist],
  minimum_wait_for_delayed_report_status_update_in_ms: [isPositiveIntegerNumberIfExist]
};

function isRequired (value, allState) {
  if (isUndefined(value) || value === '') {
    return 'Required field'
  }
}

function isPositiveIntegerNumberIfExist (value, allState) {
  if (isUndefined(value)) {
    return;
  }

  if (!Number.isInteger(Number(value)) || Number(value) <= 0) {
    return 'Must be positive integer'
  }
}

function isPositiveFloatNumberIfExist (value, allState) {
  if (isUndefined(value)) {
    return;
  }

  if (Number.isNaN(value)) {
    return 'Must be positive float'
  }

  try {
    let float = parseFloat(value);
    if (Number.isNaN(float) || Number(float) <= 0) {
      return 'Must be positive float'
    }
  } catch (e) {
    return 'Must be positive float'
  }
}
