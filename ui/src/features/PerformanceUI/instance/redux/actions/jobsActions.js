import * as Types from '../types/jobsTypes';

export const getJobs = () => (
  { type: Types.GET_JOBS }
);

export const getJobsSuccess = (jobs) => (
  { type: Types.GET_JOBS_SUCCESS, jobs }
);

export const getJobsFaliure = (error) => (
  { type: Types.GET_JOBS_FAILURE, error }
);

export const clearErrorOnGetJobs = () => (
  { type: Types.CLEAR_ERROR_ON_GET_JOBS }
);

export const clearJobs = () => (
  { type: Types.CLEAR_JOBS }
);

export const getJob = (jobId) => (
  { type: Types.GET_JOB, jobId }
);

export const getJobSuccess = (job) => (
  { type: Types.GET_JOB_SUCCESS, job }
);

export const getJobFaliure = (error) => (
  { type: Types.GET_JOB_FAILURE, error }
);

export const clearSelectedJob = () => (
  { type: Types.CLEAR_SELECTED_JOB }
);

export const processingGetJobs = (state) => (
  { type: Types.PROCESSING_GET_JOBS, state }
);

export const createJob = (body) => (
  { type: Types.CREATE_JOB, body }
);

export const createJobSuccess = (job) => (
  { type: Types.CREATE_JOB_SUCCESS, job }
);

export const processingCreateJob = (state) => (
    {type: Types.PROCESSING_CREATE_JOB, state}
);

export const createJobFailure = (error) => (
  { type: Types.CREATE_JOB_FAILURE, error }
);

export const clearErrorOnCreateJob = () => (
  { type: Types.CLEAR_ERROR_ON_CREATE_JOB }
);

export const stopRunningJob = (jobId, runId) => (
  { type: Types.STOP_RUNNING_JOB, jobId, runId }
);

export const stopRunningJobSuccess = (job) => (
  { type: Types.STOP_RUNNING_JOB_SUCCESS, job }
);

export const stopRunningJobFailure = (error) => (
  { type: Types.STOP_RUNNING_JOB_FAILURE, error }
);

export const clearStopJobSuccess = () => (
  { type: Types.CLEAR_STOP_JOB_SUCCESS }
);

export const clearErrorOnStopJob = () => (
  { type: Types.CLEAR_ERROR_ON_JOB_FAILURE }
);

export const deleteJob = (jobId) => (
  { type: Types.DELETE_JOB, jobId }
);

export const deleteJobSuccess = () => (
  { type: Types.DELETE_JOB_SUCCESS }
);

export const deleteJobFailure = (error) => (
  { type: Types.DELETE_JOB_FAILURE, error }
);

export const clearErrorOnDeleteJob = () => (
  { type: Types.CLEAR_ERROR_DELETE_JOB }
);

export const clearDeleteJobSuccess = () => (
  { type: Types.CLEAR_DELETE_JOB_SUCCESS }
);

export const processingDeleteJob = () => (
  { type: Types.PROCESSING_DELETE_JOB }
);
