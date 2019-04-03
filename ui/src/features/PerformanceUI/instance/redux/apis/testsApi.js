import axios from 'axios';
import env from '../../../../../App/common/env';


export const getTestsFromFramework = (queryParams) => {
  return axios.get(queryParams ? `${env.PREDATOR_URL}/tests${queryParams}` : `${env.PREDATOR_URL}/tests`, {
    headers: {},
    responseType: 'json'
  });
};

export const createTestInFramework = (body) => {
  return axios.post(`${env.PREDATOR_URL}/tests`, body, {
    headers: {},
    responseType: 'json'
  });
};
export const editTestInFramework = (body, id) => {
  return axios.put(`${env.PREDATOR_URL}/tests/${id}`, body, {
    headers: {},
    responseType: 'json'
  });
};

export const getTestFromFramework = (testId) => {
  return axios.get(`${env.PREDATOR_URL}/tests/${testId}`, {
    headers: {},
    responseType: 'json'
  });
};

export const deleteTestInFramework = (testId) => {
  return axios.delete(`${env.PREDATOR_URL}/tests/${testId}`, {
    headers: {}
  });
};
