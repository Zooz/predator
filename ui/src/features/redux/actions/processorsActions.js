import * as Types from '../types/processorsTypes';

export const createProcessor = (body) => (
    {type: Types.CREATE_PROCESSOR, body}
)

export const createProcessorSuccess = (value) => (
    {type: Types.CREATE_PROCESSOR_SUCCESS, value}
)

export const deleteProcessor = (id) => (
    {type: Types.DELETE_PROCESSOR, id}
)
export const deleteProcessorSuccess = (value) => (
    {type: Types.DELETE_PROCESSOR_SUCCESS, value}
)

export const deleteProcessorFailure = (value) => (
    {type: Types.DELETE_PROCESSOR_FAILURE, value}
);
export const getProcessors = () => (
    {type: Types.GET_PROCESSORS}
);

export const getProcessorsSuccess = (processors) => (
    {type: Types.GET_PROCESSORS_SUCCESS, processors}
);


export const processorsLoading = (value) => (
    {type: Types.PROCESSORS_LOADING, value}
);


export const getProcessorsFailure = (error) => (
    {type: Types.GET_PROCESSORS_FAILURE, error}
);

export const editProcessor = (id, body) => (
    {type: Types.EDIT_PROCESSOR, id, body}
)
export const editProcessorSuccess = (value) => (
    {type: Types.EDIT_PROCESSOR_SUCCESS, value}
)

export const editProcessorFailure = (value) => (
    {type: Types.EDIT_PROCESSOR_FAILURE, value}
);
