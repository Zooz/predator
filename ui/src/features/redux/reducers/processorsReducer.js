import Immutable from 'immutable';
import * as Types from '../types/processorsTypes'

const initialState = Immutable.Map({
    processors: [],
    processors_loading: false,
    processor_error: undefined,
    create_processor_success: false,
    delete_processor_success: false,
});
// TODO split processor error to each action

export default function reduce(state = initialState, action = {}) {
    console.log("manor action",action);
    switch (action.type) {
        case Types.PROCESSORS_LOADING:
            return state.set('processors_loading', action.value);
        case Types.GET_PROCESSORS_SUCCESS:
            return state.set('processors', action.processors);
        case Types.GET_PROCESSORS_FAILURE:
            return state.set('processor_error', action.error);
        case Types.CREATE_PROCESSOR_SUCCESS:
            return state.set('create_processor_success', action.value);
        case Types.DELETE_PROCESSOR_SUCCESS:
            return state.set('delete_processor_success', action.value);
        case Types.EDIT_PROCESSOR_SUCCESS:
            return state.set('edit_processor_success', action.value);
        case Types.DELETE_PROCESSOR_FAILURE:
            return state.set('delete_processor_failure', action.value);
        case Types.CREATE_PROCESSOR_FAILURE:
            return state.set('processor_error', action.error);
        case Types.EDIT_PROCESSOR_FAILURE:
            return state.set('processor_error', action.error);
        case Types.CLEAN_ALL_ERRORS:
            return state.set('processor_error', undefined);

        default:
            return state;
    }
}
