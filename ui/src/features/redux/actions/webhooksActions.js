import * as Types from '../types/webhooks';

export const getWebhooks = () => (
    {type: Types.GET_WEBHOOKS}
);

export const getWebhooksSuccess = (value) => (
    {type: Types.GET_WEBHOOKS_SUCCESS, value}
);

export const createWebhook = (body) => (
    {type: Types.CREATE_WEBHOOK, body}
);

export const createWebHookSuccess = (value) => (
    {type: Types.CREATE_WEBHOOK_SUCCESS, value}
);

export const createWebHookFailure = (value) => (
    {type: Types.CREATE_WEBHOOK_FAILUE, value}
);

export const editWebHookSuccess = (value) => (
    {type: Types.EDIT_WEBHOOK_SUCCESS, value}
);

export const editWebHookFailure = (value) => (
    {type: Types.EDIT_WEBHOOK_FAILURE, value}
);

export const deleteWebHook = (id) => (
    {type: Types.DELETE_WEBHOOK, id}
);

export const deleteWebHookSuccess = (value) => (
    {type: Types.DELETE_WEBHOOK_SUCCESS, value}
);

export const deleteWebHookFailure = (value) => (
    {type: Types.DELETE_WEBHOOK_FAILURE, value}
);

export const getWebHookFailure = (value) => (
    {type: Types.GET_WEBHOOKS_FAILURE, value}
);

export const setLoading = (value) => (
    {type: Types.LOADING, value}
);

export const cleanErrors = (value) => (
    {type: Types.CLEAN_ERRORS, value}
);

export const editWebhook = (body, id) => (
    {type: Types.EDIT_WEBHOOK, body, id}
);
