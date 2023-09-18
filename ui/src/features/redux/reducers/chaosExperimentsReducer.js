import Immutable from 'immutable';
import * as Types from '../types/chaosExperimentsTypes'

const initialState = Immutable.Map({
  chaosExperiments: [],
  chaosExperiments_loading: false,
  chaosExperiment_error: undefined,
  create_chaosExperiment_success: false,
  delete_chaosExperiment_success: false,
  delete_chaosExperiment_failure: false
});

export default function reduce (state = initialState, action = {}) {
  switch (action.type) {
  case Types.CHAOS_EXPERIMENTS_LOADING:
    return state.set('chaosExperiments_loading', action.value);
  case Types.GET_CHAOS_EXPERIMENTS_SUCCESS:
    return state.set('chaosExperiments',
      action.chaosExperiments.map((chaosExperiment) => ({
        ...chaosExperiment, kind: chaosExperiment.kubeObject.kind }
      )));
  case Types.GET_CHAOS_EXPERIMENTS_FAILURE:
    return state.set('chaosExperiment_error', action.error);
  case Types.CREATE_CHAOS_EXPERIMENT_SUCCESS:
    return state.set('create_chaosExperiment_success', action.value);
  case Types.DELETE_CHAOS_EXPERIMENT:
    return state.set('delete_chaosExperiment_success', action.value);
  case Types.DELETE_CHAOS_EXPERIMENT_FAILURE:
    return state.set('delete_chaosExperiment_failure', action.value);
  case Types.CREATE_CHAOS_EXPERIMENT_FAILURE:
    return state.set('chaosExperiment_error', action.error);
  case Types.CLEAN_ALL_ERRORS:
    return state.set('chaosExperiment_error', undefined)
      .set('delete_processor_failure', false);
  default:
    return state;
  }
}
