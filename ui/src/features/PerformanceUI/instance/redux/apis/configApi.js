import axios from 'axios';
import env from '../../../../../App/common/env';

export const getFrameworkConfig = (queryParams) => {
  let url = queryParams ? `${env.PREDATOR_URL}/config/${queryParams}` : `${env.PREDATOR_URL}/config`;

  return axios.get(url, {
    headers: {
    }
  });
};

export const getConfigDataMap = () => {
  return axios.get(`${env.PREDATOR_URL}/config/dataMap`, {
    headers: {
    }
  });
};

export const updateFrameworkConfig = (body) => {
    return axios.put(`${env.PREDATOR_URL}/config`, body, {
      headers: {},
      responseType: 'json'
    });
};
