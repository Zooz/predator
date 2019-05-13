import Immutable from 'immutable';
import * as Types from '../types/jobsTypes'

const initialState = Immutable.Map({
  jobs: [],
  job: undefined,
  processing_get_jobs: false,
  error_get_jobs: undefined,
  error_get_job: undefined,
  processing_create_job: false,
  error_create_job: undefined,
  error_stop_job: undefined,
  error_delete_job: undefined,
  processing_delete_job: false,
  delete_job_success: false
});

export default function reduce (state = initialState, action = {}) {
  switch (action.type) {
  case Types.GET_JOBS_FAILURE:
    return state.set('error_get_jobs', action.error);
  case Types.GET_JOBS_SUCCESS:
    return state.set('jobs', action.jobs);
  case Types.CLEAR_JOBS:
    return state.set('jobs', []);
  case Types.CLEAR_ERROR_ON_GET_JOBS:
    return state.set('error_get_jobs', undefined);
  case Types.GET_JOB_FAILURE:
    return state.set('error_get_job', action.error);
  case Types.GET_JOB_SUCCESS:
    return state.set('job', action.job);
  case Types.PROCESSING_GET_JOBS:
    return state.set('processing_get_jobs', action.state);
  case Types.CLEAR_SELECTED_JOB:
    return state.set('job', undefined);
  case Types.PROCESSING_CREATE_JOB:
    return state.set('processing_create_job', action.state);
  case Types.CREATE_JOB_FAILURE:
    return state.set('error_create_job', action.error);
  case Types.CREATE_JOB_SUCCESS:
    return state.set('job', action.job);
  case Types.CLEAR_ERROR_ON_CREATE_JOB:
    return state.set('error_create_job', undefined);
  case Types.STOP_RUNNING_JOB_FAILURE:
    return state.set('error_stop_job', action.error);
  case Types.CLEAR_ERROR_ON_JOB_FAILURE:
    return state.set('error_stop_job', undefined);
  case Types.STOP_RUNNING_JOB_SUCCESS:
    return state.set('stop_job_success', true);
  case Types.CLEAR_STOP_JOB_SUCCESS:
    return state.set('stop_job_success', false);
  case Types.DELETE_JOB_SUCCESS:
    return state.set('delete_job_success', true);
  case Types.CLEAR_DELETE_JOB_SUCCESS:
    return state.set('delete_job_success', false);
  case Types.DELETE_JOB_FAILURE:
    return state.set('error_delete_job', action.error);
  case Types.CLEAR_ERROR_DELETE_JOB:
    return state.set('error_delete_job', undefined);
  case Types.PROCESSING_DELETE_JOB:
    return state.set('processing_delete_job', action.state);
  default:
    return state;
  }
}
