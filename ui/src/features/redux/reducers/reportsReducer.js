import Immutable from 'immutable';
import * as Types from '../types/reportsTypes'

const initialState = Immutable.Map({
    reports: [],
    report: undefined,
    processing_get_reports: false,
    error_get_reports: undefined,
    error_get_report: undefined,
    create_benchmark_success: false,
    edit_notes_success: false,
    edit_report_failure: undefined,
    create_benchmark_failure: undefined,
    selected_reports: {},
    aggregate_reports: [],
    benchmark: undefined,
    delete_report_success: false
});

export default function reduce(state = initialState, action = {}) {
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
        case Types.PROCESSING_GET_REPORT:
            return state.set('processing_get_report', action.state);
        case Types.CLEAR_SELECTED_REPORT:
            return state.set('report', undefined);
        case Types.GET_AGGREGATE_REPORTS_SUCCESS:
            return state.set('aggregate_reports', action.data);
        case Types.CREATE_BENCHMARK_SUCCESS:
            return state.set('create_benchmark_success', action.value);
        case Types.EDIT_REPORT_SUCCESS:
            return state.set('edit_notes_success', action.value);
        case Types.EDIT_REPORT_FAILURE:
            return state.set('edit_report_failure', action.error);
        case Types.DELETE_REPORT_SUCCESS:
            return state.set('delete_report_success', action.numberOfDeletedReports);
        case Types.DELETE_REPORT_FAILURE:
            return state.set('delete_report_failure', action.error);
        case Types.CREATE_BENCHMARK_FAILURE:
            return state.set('create_benchmark_failure', action.error);
        case Types.ADD_REPORT_FOR_COMPARE:
            const currentSelectedReports = JSON.parse(JSON.stringify(state.get('selected_reports')));
            currentSelectedReports[action.testId] = currentSelectedReports[action.testId] || {};
            currentSelectedReports[action.testId][action.reportId] = action.value;
            return state.set('selected_reports', currentSelectedReports);
        case Types.CLEAR_SELECTED_REPORTS:
            return state.set('selected_reports', {});
        case Types.CLEAN_ALL_ERRORS:
            const newState = (state.set('error_get_reports', undefined)
                .set('error_get_reports', undefined)
                .set('delete_report_failure', undefined)
                .set('edit_report_failure', undefined)
                .set('create_benchmark_failure', undefined));

            return newState;
        case Types.GET_BENCHMARK_SUCCESS:
            return state.set('benchmark', action.data);
        case Types.CLEAR_AGGREGATE_REPORT_AND_BENCHMARK:
            return state.set('aggregate_reports', [])
                .set('benchmark', undefined);
        default:
            return state;
    }
}
