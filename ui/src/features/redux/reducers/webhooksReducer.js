import Immutable from 'immutable';
import * as Types from '../types/webhooks'

const initialState = Immutable.Map({
    webhooks: [],
    create_webhook_success: false,
    edit_webhook_success: false,
    webhook_error: undefined,
    get_webhooks_error: undefined,
    loading: false,
});

export default function reduce(state = initialState, action = {}) {
    switch (action.type) {
        case Types.CREATE_WEBHOOK_SUCCESS:
            return state.set('create_webhook_success', action.value);
        case Types.EDIT_WEBHOOK_SUCCESS:
            return state.set('edit_webhook_success', action.value);
        case Types.GET_WEBHOOKS_SUCCESS:
            return state.set('webhooks', action.value);
        case Types.LOADING:
            return state.set('loading', action.value);
        case Types.GET_WEBHOOKS_FAILURE:
        case Types.CREATE_WEBHOOK_FAILUE:
        case Types.EDIT_WEBHOOK_FAILURE:
            return state.set('webhook_error', action.value);
        case Types.CLEAN_ERRORS:
            return state.set('webhook_error', undefined);

        default:
            return state;
    }
}
