import Immutable from 'immutable';
import * as Types from '../types/configTypes'

const initialState = Immutable.Map({
    config: undefined,
    processing_get_config: false,
    processing_update_config: false,
    processing_delete_config_key: false,
    error_get_config: undefined,
    error_update_config: undefined
});

export default function reduce (state = initialState, action = {}) {
    switch (action.type) {
        case Types.GET_CONFIG_SUCCESS:
            return state.set('config', action.config);
        case Types.PROCESSING_GET_CONFIG:
            return state.set('processing_get_config', action.state);
        case Types.PROCESSING_UPDATE_CONFIG:
            return state.set('processing_update_config', action.state);
        case Types.PROCESSING_DELETE_CONFIG_KEY:
            return state.set('processing_delete_config_key', action.state);
        case Types.GET_CONFIG_FAILURE:
            return state.set('error_get_config', action.error);
        case Types.UPDATE_CONFIG_FAILURE:
            return state.set('error_update_config', action.error);
        case Types.CLEAR_ERROR_ON_UPDATE_CONFIG:
            return state.set('error_update_config', undefined);
        case Types.UPDATE_CONFIG_SUCCESS:
            return state.set('update_config_success', true);
        case Types.CLEAN_UPDATE_CONFIG_SUCCESS:
            return state.set('update_config_success', undefined);
        default:
            return state;
    }
}
