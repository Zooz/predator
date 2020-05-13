import axios from 'axios';
import env from '../../../App/common/env';
import {getAuthorizationHeader} from "./apiUtils";


export const getTestsFromFramework = (queryParams) => {
  return axios.get(queryParams ? `${env.PREDATOR_URL}/tests${queryParams}` : `${env.PREDATOR_URL}/tests`, {
    headers: getAuthorizationHeader(),
    responseType: 'json'
  });
};

export const createFileInFramework = (file) => {
    const data = new FormData();
    data.append('csv', file);

    return axios.post(`${env.PREDATOR_URL}/files`, data, {
    headers: getAuthorizationHeader(),
    responseType: 'json'
  });
};
export const createTestInFramework = (body) => {
  return axios.post(`${env.PREDATOR_URL}/tests`, body, {
    headers: getAuthorizationHeader(),
    responseType: 'json'
  });
};
export const editTestInFramework = (body, id) => {
  return axios.put(`${env.PREDATOR_URL}/tests/${id}`, body, {
    headers: getAuthorizationHeader(),
    responseType: 'json'
  });
};

export const getTestFromFramework = (testId) => {
  return axios.get(`${env.PREDATOR_URL}/tests/${testId}`, {
    headers: getAuthorizationHeader(),
    responseType: 'json'
  });
};

export const deleteTestInFramework = (testId) => {
  return axios.delete(`${env.PREDATOR_URL}/tests/${testId}`, {
    headers: getAuthorizationHeader()
  });
};
