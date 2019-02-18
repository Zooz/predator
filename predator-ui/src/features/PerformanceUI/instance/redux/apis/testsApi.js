import axios from 'axios';
import env from '../../../../../App/common/env';

export const getTestsFromFramework = (queryParams) => {
  return axios.get(queryParams ? `${env.PERFORMANCE_FRAMEWORK_API_URL}/tests${queryParams}` : `${env.PERFORMANCE_FRAMEWORK_API_URL}/tests`, {
    headers: {},
    responseType: 'json'
  });
};

export const createTestInFramework = (body) => {
  return axios.post(`${env.PERFORMANCE_FRAMEWORK_API_URL}/tests`, body, {
    headers: {},
    responseType: 'json'
  });
};
export const editTestInFramework = (body, id) => {
  return axios.put(`${env.PERFORMANCE_FRAMEWORK_API_URL}/tests/${id}`, body, {
    headers: {},
    responseType: 'json'
  });
};

export const getTestFromFramework = (testId) => {
  return axios.get(`${env.PERFORMANCE_FRAMEWORK_API_URL}/tests/${testId}`, {
    headers: {},
    responseType: 'json'
  });
};

export const deleteTestInFramework = (testId) => {
  return axios.delete(`${env.PERFORMANCE_FRAMEWORK_API_URL}/tests/${testId}`, {
    headers: {}
  });
};
