import axios from 'axios';
import env from '../../../App/common/env';

export const getFrameworkConfig = (queryParams) => {
    let url = queryParams ? `${env.PREDATOR_URL}/config/${queryParams}` : `${env.PREDATOR_URL}/config`;
    return axios.get(url, {
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

export const deleteFrameworkConfigKey = (configKey) => {
    return axios.delete(`${env.PREDATOR_URL}/config/${configKey}`, {
        headers: {},
        responseType: 'json'
    });
};

