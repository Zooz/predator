import Immutable from 'immutable';
import * as Types from '../types/reportsTypes'

const initialState = Immutable.Map({
  reports: [],
  report: undefined,
  processing_get_reports: false,
  error_get_reports: undefined,
  error_get_report: undefined
});

export default function reduce (state = initialState, action = {}) {
  switch (action.type) {
  case Types.GET_REPORTS_FAILURE:
    return state.set('error_get_reports', action.error);
  case Types.GET_REPORTS_SUCCESS:
    return state.set('reports', action.reports);
  case Types.CLEAR_REPORTS:
    return state.set('reports', undefined);
  case Types.CLEAR_ERROR_ON_GET_REPORTS:
    return state.set('error_get_reports', undefined);
  case Types.GET_REPORT_FAILURE:
    return state.set('error_get_report', action.error);
  case Types.GET_REPORT_SUCCESS:
    return state.set('report', action.report);
  case Types.PROCESSING_GET_REPORTS:
    return state.set('processing_get_reports', action.state);
  case Types.CLEAR_SELECTED_REPORT:
    return state.set('report', undefined);
  case Types.GET_AGGREGATE_REPORT_SUCCESS:
    return state.set('aggregate_report', action.data);
  default:
    return state;
  }
}
