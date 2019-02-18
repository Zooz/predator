import axios from 'axios';
import env from '../../../../../App/common/env';


export const getJobsFromFramework = (queryParams) => {
  let url = queryParams ? `CHANGE_ME_TO_EXTERNAL_ADDRESS/jobs${queryParams}` : `CHANGE_ME_TO_EXTERNAL_ADDRESS/jobs`;
  return axios.get(url, {
    headers: {
    }
  });
};

export const getJobFromFramework = (jobId) => {
  return axios.get(`CHANGE_ME_TO_EXTERNAL_ADDRESS/jobs/${jobId}`, {
    headers: {
    }
  });
};

export const createJobInFramework = (body) => {
  return axios.post(`CHANGE_ME_TO_EXTERNAL_ADDRESS/jobs/`, body, {
    headers: {}
  });
};

export const stopRunningJobInFramework = (jobId, runId) => {
  return axios.post(`CHANGE_ME_TO_EXTERNAL_ADDRESS/jobs/${jobId}/runs/${runId}/stop`, undefined, {
    headers: {}
  });
};

export const deleteJobInFramework = (jobId) => {
  return axios.delete(`CHANGE_ME_TO_EXTERNAL_ADDRESS/jobs/${jobId}`, {
    headers: {
    }
  });
};
