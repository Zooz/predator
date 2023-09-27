
const SCHEMA = {
  type: 'object',
  properties: {
    apiVersion: {
      type: 'string',
      pattern: new RegExp('^chaos-mesh\\.org\\/v1alpha1$')
    },
    kind: {
      type: 'string',
      options: ['PodChaos', 'DNSChaos', 'AWSChaos', 'HTTPChaos', 'StressChaos']
    },
    metadata: {
      type: 'object',
      properties: {
        name: { type: 'string', required: true },
        namespace: { type: 'string', required: true }
      },
      required: ['name', 'namespace']
    },
    spec: {
      type: 'object',
      properties: {
        duration: {
          type: 'string',
          pattern: new RegExp('^[0-9]+(ms|s|m|h)$')
        },
        required: ['duration']
      }
    }
  },
  required: ['apiVersion', 'kind', 'metadata', 'spec']
};

const validateKubeObject = (jsonObject) => {
  const validationError = validateProperty(jsonObject, SCHEMA);

  if (validationError) {
    return validationError;
  }
}

function validateProperty (object, schema) {
  for (const key in schema.properties) {
    const propertySchema = schema.properties[key];

    if (propertySchema.required && !object.hasOwnProperty(key)) {
      return `Required property "${key}" is missing.`;
    }

    if (object.hasOwnProperty(key)) {
      const propertyValue = object[key];
      const { type, pattern, required, options } = propertySchema;

      if (type === 'object' && typeof propertyValue !== 'object') {
        return `Property "${key}" must be an object.`;
      } else if (type === 'string' && typeof propertyValue !== 'string') {
        return `Property "${key}" must be a string.`;
      } else if (type === 'string' && typeof propertyValue === 'string' && required && !propertyValue.trim().length) {
        return `Property "${key}" must be a non empty string.`;
      } else if (type === 'string' && pattern) {
        if (!pattern.test(propertyValue)) {
          return `Property "${key}"  value must be in supported pattern "${pattern}".`;
        }
      } else if (type === 'string' && options) {
        if (!options.includes(propertyValue)) {
          return `Property "${key}"  value must be in supported options "[${options.join(', ')}]".`;
        }
      }

      if (propertySchema.properties) {
        const nestedValidationResult = validateProperty(propertyValue, propertySchema);
        if (nestedValidationResult !== null) {
          return `Invalid value for property "${key}": ${nestedValidationResult}`;
        }
      }
    }
  }

  return null;
}

export default validateKubeObject;
