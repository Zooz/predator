import axios from 'axios';
import env from '../../../App/common/env';
import {getAuthorizationHeader} from './apiUtils';

export const getJobsFromFramework = (queryParams) => {

  let url = queryParams ? `${env.PREDATOR_URL}/jobs${queryParams}` : `${env.PREDATOR_URL}/jobs`;
  return axios.get(url, {
    headers: getAuthorizationHeader()
  });
};

export const getJobFromFramework = (jobId) => {
  return axios.get(`${env.PREDATOR_URL}/jobs/${jobId}`, {
    headers: getAuthorizationHeader()
});
};

export const createJobInFramework = (body) => {
  return axios.post(`${env.PREDATOR_URL}/jobs/`, body, {
    headers: getAuthorizationHeader()
  });
};

export const editJobInFramework = (jobId,body) => {
  return axios.put(`${env.PREDATOR_URL}/jobs/${jobId}`, body, {
    headers: getAuthorizationHeader()
  });
};

export const stopRunningJobInFramework = (jobId, runId) => {
  return axios.post(`${env.PREDATOR_URL}/jobs/${jobId}/runs/${runId}/stop`, undefined, {
    headers: getAuthorizationHeader()
  });
};

export const deleteJobInFramework = (jobId) => {
  return axios.delete(`${env.PREDATOR_URL}/jobs/${jobId}`, {
    headers: getAuthorizationHeader()
  });
};
