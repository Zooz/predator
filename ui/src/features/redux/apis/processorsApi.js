import axios from 'axios';
import env from '../../../App/common/env';

export const getProcessorsApi = () => {
  return axios.get(`${env.PREDATOR_URL}/processors`, {
    responseType: 'json'
  });
};
