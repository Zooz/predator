import * as Types from '../types/processorsTypes';

export const getProcessors = () => (
  { type: Types.GET_PROCESSORS }
);

export const getProcessorsSuccess = (processors) => (
  { type: Types.GET_PROCESSORS_SUCCESS, processors }
);


export const processorsLoading = (value) => (
  { type: Types.PROCESSORS_LOADING, value }
);


export const processorsFailure = (error) => (
  { type: Types.GET_PROCESSORS_FAILURE, error }
);

