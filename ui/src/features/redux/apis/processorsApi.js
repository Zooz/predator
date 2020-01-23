import axios from 'axios';
import env from '../../../App/common/env';

export const getProcessorsApi = (params) => {
  return axios.get(`${env.PREDATOR_URL}/processors`, {
    responseType: 'json',params
  });
};

export const createProcessorApi = (body) => {
  return axios.post(`${env.PREDATOR_URL}/processors`,body, {
    responseType: 'json'
  });
};

export const deleteProcessorApi = (id) => {
  return axios.delete(`${env.PREDATOR_URL}/processors/${id}`, {
    responseType: 'json'
  });
};

export const editProcessorApi = (id,body) => {
  return axios.put(`${env.PREDATOR_URL}/processors/${id}`,body, {
    responseType: 'json'
  });
};
