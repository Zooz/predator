import axios from 'axios';
import env from '../../../../../App/common/env';
import {getHeaders} from "./apiUtils";


export const getTestsFromFramework = (queryParams) => {
  return axios.get(queryParams ? `${env.PREDATOR_URL}/tests${queryParams}` : `${env.PREDATOR_URL}/tests`, {
    headers: getHeaders(),
    responseType: 'json'
  });
};

export const createTestInFramework = (body) => {
  return axios.post(`${env.PREDATOR_URL}/tests`, body, {
    headers: getHeaders(),
    responseType: 'json'
  });
};
export const editTestInFramework = (body, id) => {
  return axios.put(`${env.PREDATOR_URL}/tests/${id}`, body, {
    headers: getHeaders(),
    responseType: 'json'
  });
};

export const getTestFromFramework = (testId) => {
  return axios.get(`${env.PREDATOR_URL}/tests/${testId}`, {
    headers: getHeaders(),
    responseType: 'json'
  });
};

export const deleteTestInFramework = (testId) => {
  return axios.delete(`${env.PREDATOR_URL}/tests/${testId}`, {
    headers: getHeaders()
  });
};
