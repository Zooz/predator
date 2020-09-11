export const webhooks = (state) => state.WebhooksReducer.get('webhooks');
export const loading = (state) => state.WebhooksReducer.get('loading');
export const webhookSuccess = (state) => state.WebhooksReducer.get('create_webhook_success');
export const webhookError = (state) => state.WebhooksReducer.get('webhook_error');
