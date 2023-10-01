import axios from 'axios';
import env from '../../../App/common/env';

export const getChaosExperimentsApi = (params) => {
  return axios.get(`${env.PREDATOR_URL}/chaos-experiments`, {
    responseType: 'json', params
  });
};

export const createChaosExperimentApi = (body) => {
  return axios.post(`${env.PREDATOR_URL}/chaos-experiments`, body, {
    responseType: 'json'
  });
};

export const deleteChaosExperimentApi = (id) => {
  return axios.delete(`${env.PREDATOR_URL}/chaos-experiments/${id}`, {
    responseType: 'json'
  });
};
