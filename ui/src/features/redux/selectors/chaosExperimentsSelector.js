import { createSelector } from 'reselect';

export const chaosExperimentsList = (state) => state.ChaosExperimentsReducer.get('chaosExperiments');
export const chaosExperimentsLoading = (state) => state.ChaosExperimentsReducer.get('chaosExperiments_loading');
export const chaosExperimentFailure = (state) => state.ChaosExperimentsReducer.get('chaosExperiment_error');
export const createChaosExperimentSuccess = (state) => state.ChaosExperimentsReducer.get('create_chaosExperiment_success');
export const updateChaosExperimentSuccess = (state) => state.ChaosExperimentsReducer.get('update_chaosExperiment_success');
export const deleteChaosExperimentSuccess = (state) => state.ChaosExperimentsReducer.get('delete_chaosExperiment_success');
export const deleteChaosExperimentFailure = (state) => state.ChaosExperimentsReducer.get('delete_chaosExperiment_failure');

export const chaosExperimentsForDropdown = createSelector(chaosExperimentsList, (experiments) => {
  return experiments.map((experiment) => ({ key: experiment.id, value: experiment.name }));
});
