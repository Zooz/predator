import Immutable from 'immutable';
import * as Types from '../types/processorsTypes'

const initialState = Immutable.Map({
  processors: [],
  processors_loading: false,
  processor_error:undefined
});

export default function reduce (state = initialState, action = {}) {
  switch (action.type) {
  case Types.PROCESSORS_LOADING:
    return state.set('processors_loading', action.value);
  case Types.GET_PROCESSORS_SUCCESS:
    return state.set('processors', action.processors);
  case Types.GET_PROCESSORS_FAILURE:
    return state.set('processor_error', action.error);
  case Types.CLEAN_ALL_ERRORS:
    return state.set('processor_error', undefined);

  default:
    return state;
  }
}
