import {createSelector} from 'reselect'
import {filter} from 'lodash'

export const webhooks = (state) => state.WebhooksReducer.get('webhooks');
export const loading = (state) => state.WebhooksReducer.get('loading');
export const webhookSuccess = (state) => state.WebhooksReducer.get('create_webhook_success');
export const editWebhookSuccess = (state) => state.WebhooksReducer.get('edit_webhook_success');
export const deleteWebhookSuccess = (state) => state.WebhooksReducer.get('delete_webhook_success');
export const testWebhookSuccess = (state) => state.WebhooksReducer.get('test_webhook_success');
export const webhookError = (state) => state.WebhooksReducer.get('webhook_error');

export const sortedWebhooksWithSpacer = createSelector(webhooks, (webhooks) => {
    const globalWebhooks = filter(webhooks, (webhook) => webhook.global);
    const localWebhooks = filter(webhooks, (webhook) => !webhook.global);
    if (localWebhooks.length > 0 && globalWebhooks.length > 0) {
        return [...globalWebhooks, 'SPACER', ...localWebhooks];
    }
    return globalWebhooks.concat(localWebhooks);

});

export const webhooksForDropdown = createSelector(webhooks, (webhooks) => {
    return webhooks.filter((webhook) => webhook.global === false).map((webhook) => {
        return {key: webhook.id, value: webhook.name};
    });
});
