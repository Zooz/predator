import axios from 'axios';
import env from '../../../../../App/common/env';

export const getJobsFromFramework = (queryParams) => {
  let url = queryParams ? `${env.PERFORMANCE_FRAMEWORK_API_URL}/jobs${queryParams}` : `${env.PERFORMANCE_FRAMEWORK_API_URL}/jobs`;
  return axios.get(url, {
    headers: {
    }
  });
};

export const getJobFromFramework = (jobId) => {
  return axios.get(`${env.PERFORMANCE_FRAMEWORK_API_URL}/jobs/${jobId}`, {
    headers: {
    }
  });
};

export const createJobInFramework = (body) => {
  return axios.post(`${env.PERFORMANCE_FRAMEWORK_API_URL}/jobs/`, body, {
    headers: {}
  });
};

export const stopRunningJobInFramework = (jobId, runId) => {
  return axios.post(`${env.PERFORMANCE_FRAMEWORK_API_URL}/jobs/${jobId}/runs/${runId}/stop`, undefined, {
    headers: {}
  });
};

export const deleteJobInFramework = (jobId) => {
  return axios.delete(`${env.PERFORMANCE_FRAMEWORK_API_URL}/jobs/${jobId}`, {
    headers: {
    }
  });
};
