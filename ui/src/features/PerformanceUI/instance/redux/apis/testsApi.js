import axios from 'axios';
import env from '../../../../../App/common/env';


export const getTestsFromFramework = (queryParams) => {
  return axios.get(queryParams ? `CHANGE_ME_TO_EXTERNAL_ADDRESS/tests${queryParams}` : `CHANGE_ME_TO_EXTERNAL_ADDRESS/tests`, {
    headers: {},
    responseType: 'json'
  });
};

export const createTestInFramework = (body) => {
  return axios.post(`CHANGE_ME_TO_EXTERNAL_ADDRESS/tests`, body, {
    headers: {},
    responseType: 'json'
  });
};
export const editTestInFramework = (body, id) => {
  return axios.put(`CHANGE_ME_TO_EXTERNAL_ADDRESS/tests/${id}`, body, {
    headers: {},
    responseType: 'json'
  });
};

export const getTestFromFramework = (testId) => {
  return axios.get(`CHANGE_ME_TO_EXTERNAL_ADDRESS/tests/${testId}`, {
    headers: {},
    responseType: 'json'
  });
};

export const deleteTestInFramework = (testId) => {
  return axios.delete(`CHANGE_ME_TO_EXTERNAL_ADDRESS/tests/${testId}`, {
    headers: {}
  });
};
