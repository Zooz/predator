import Immutable from 'immutable';
import * as Types from '../types/testsTypes'

const initialState = Immutable.Map({
  tests: [],
  test: undefined,
  processing_get_tests: false,
  error_get_tests: undefined,
  error_get_test: undefined,
  delete_test_success: false,
  error_delete_test: undefined,
  error_create_test: undefined,
  processing_delete_test: false,
  create_test_success: false,
  isLoading: false
});

export default function reduce (state = initialState, action = {}) {
  switch (action.type) {
  case Types.GET_TESTS_FAILURE:
    return state.set('error_get_tests', action.error);
  case Types.GET_TESTS_SUCCESS:
    return state.set('tests', action.tests);
  case Types.CLEAR_TESTS:
    return state.set('tests', undefined);
  case Types.CLEAR_ERROR_ON_GET_TESTS:
    return state.set('error_get_tests', undefined);
  case Types.GET_TEST_FAILURE:
    return state.set('error_get_test', action.error);
  case Types.SET_TEST:
    return state.set('test', action.test);
  case Types.GET_TEST_SUCCESS:
    return state.set('test', action.test);
  case Types.PROCESSING_GET_TESTS:
    return state.set('processing_get_tests', action.state);
  case Types.CLEAR_SELECTED_TEST:
    return state.set('test', undefined);
  case Types.DELETE_TEST_SUCCESS:
    return state.set('delete_test_success', true);
  case Types.CREATE_TEST_SUCCESS:
    return state.set('create_test_success', true);
  case Types.CLEAR_DELETE_TEST_SUCCESS:
    return state.set('delete_test_success', false);
  case Types.DELETE_TEST_FAILURE:
    return state.set('error_delete_test', action.error);
  case Types.CREATE_TEST_FAILURE:
    return state.set('error_create_test', action.error);
  case Types.CLEAR_ERROR_DELETE_TEST:
    return state.set('error_delete_test', undefined);
  case Types.PROCESSING_DELETE_TEST:
    return state.set('processing_delete_test', action.state);
  case Types.IS_LOADING:
    return state.set('isLoading', action.isLoading);
  case Types.CLEAN_ALL_ERRORS:
    return state.set('error_create_test', undefined)
      .set('error_get_tests', undefined)
      .set('error_delete_test', undefined);
  default:
    return state;
  }
}
