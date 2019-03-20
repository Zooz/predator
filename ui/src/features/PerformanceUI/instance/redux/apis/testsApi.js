import axios from 'axios';
import env from '../../../../../App/common/env';
import { getUrlPrefix } from '../../utils';


export const getTestsFromFramework = (queryParams) => {
  return axios.get(queryParams ? `${getUrlPrefix()}${env.PREDATOR_URL}/tests${queryParams}` : `${env.PREDATOR_URL}/tests`, {
    headers: {},
    responseType: 'json'
  });
};

export const createTestInFramework = (body) => {
  return axios.post(`${getUrlPrefix()}${env.PREDATOR_URL}/tests`, body, {
    headers: {},
    responseType: 'json'
  });
};
export const editTestInFramework = (body, id) => {
  return axios.put(`${getUrlPrefix()}${env.PREDATOR_URL}/tests/${id}`, body, {
    headers: {},
    responseType: 'json'
  });
};

export const getTestFromFramework = (testId) => {
  return axios.get(`${getUrlPrefix()}${env.PREDATOR_URL}/tests/${testId}`, {
    headers: {},
    responseType: 'json'
  });
};

export const deleteTestInFramework = (testId) => {
  return axios.delete(`${getUrlPrefix()}${env.PREDATOR_URL}/tests/${testId}`, {
    headers: {}
  });
};
