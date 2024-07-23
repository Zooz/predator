import * as Types from '../types/chaosExperimentsTypes';

export const createChaosExperiment = (body) => (
  { type: Types.CREATE_CHAOS_EXPERIMENT, body }
)

export const createChaosExperimentSuccess = (value) => (
  { type: Types.CREATE_CHAOS_EXPERIMENT_SUCCESS, value }
)

export const updateChaosExperiment = (id, body) => (
  { type: Types.UPDATE_CHAOS_EXPERIMENT, id, body }
)

export const updateChaosExperimentSuccess = (value) => (
  { type: Types.UPDATE_CHAOS_EXPERIMENT_SUCCESS, value }
)

export const updateChaosExperimentFailure = (value) => (
  { type: Types.UPDATE_CHAOS_EXPERIMENT_FAILURE, value }
)

export const deleteChaosExperiment = (id) => (
  { type: Types.DELETE_CHAOS_EXPERIMENT, id }
)
export const deleteChaosExperimentSuccess = (value) => (
  { type: Types.DELETE_CHAOS_EXPERIMENT_SUCCESS, value }
)

export const deleteChaosExperimentFailure = (value) => (
  { type: Types.DELETE_CHAOS_EXPERIMENT_FAILURE, value }
);
export const getChaosExperiments = (params) => (
  { type: Types.GET_CHAOS_EXPERIMENTS, params }
);

export const getChaosExperimentsSuccess = (chaosExperiments) => (
  { type: Types.GET_CHAOS_EXPERIMENTS_SUCCESS, chaosExperiments }
);

export const chaosExperimentsLoading = (value) => (
  { type: Types.CHAOS_EXPERIMENTS_LOADING, value }
);

export const getChaosExperimentsFailure = (error) => (
  { type: Types.GET_CHAOS_EXPERIMENTS_FAILURE, error }
);

export const cleanAllChaosExperimentsErrors = () => (
  { type: Types.CLEAN_ALL_ERRORS }
);
