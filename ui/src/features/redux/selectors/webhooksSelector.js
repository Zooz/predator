import {createSelector} from 'reselect'
import {sortBy} from 'lodash'

export const webhooks = (state) => state.WebhooksReducer.get('webhooks');
export const loading = (state) => state.WebhooksReducer.get('loading');
export const webhookSuccess = (state) => state.WebhooksReducer.get('create_webhook_success');
export const deleteWebhookSuccess = (state) => state.WebhooksReducer.get('delete_webhook_success');
export const webhookError = (state) => state.WebhooksReducer.get('webhook_error');

export const sortedWebhooks = createSelector(webhooks, (webhooks) => {

    return sortBy(webhooks, (webhook) => !webhook.global);
});

export const webhooksForDropdown = createSelector(webhooks, (webhooks) => {
    return webhooks.filter((webhook) => webhook.global === false).map((webhook) => {
        return {key: webhook.id, value: webhook.name};
    });
});
