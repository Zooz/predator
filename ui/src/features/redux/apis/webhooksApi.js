import axios from 'axios';
import env from '../../../App/common/env';

export const getWebhooksApi = () => {
    let url = `${env.PREDATOR_URL}/webhooks`;
    return axios.get(url, {
        headers: {}
    });
};

export const testWebhookApi = (id) => {
    let url = `${env.PREDATOR_URL}/webhooks/${id}/test`;
    return axios.post(url, {
        headers: {}
    });
};

export const createWebhookApi = (body) => {
    let url = `${env.PREDATOR_URL}/webhooks`;
    return axios.post(url, body, {
        headers: {}
    });
};

export const editWebhookApi = (body,id) => {
    let url = `${env.PREDATOR_URL}/webhooks/${id}`;
    return axios.put(url, body, {
        headers: {}
    });
};

export const deleteWebhookApi = (id) => {
    let url = `${env.PREDATOR_URL}/webhooks/${id}`;
    return axios.delete(url, {
        headers: {}
    });
};


