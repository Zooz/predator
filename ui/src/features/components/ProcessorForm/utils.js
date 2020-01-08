import {cloneDeep} from 'lodash';

export const createProcessorRequest = (data) => {
    const {name, description, javascript} = data;
    return {name,description,javascript};
};

export const createStateForEditTest = (data) => {
    data = cloneDeep(data);
    return {
        id: data.id,
        name: data.name,
        description: data.description,
        javascript: data.javascript
    }
};

