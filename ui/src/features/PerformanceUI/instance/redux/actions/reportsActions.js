import * as Types from '../types/reportsTypes';

export const getReports = (testId) => (
  { type: Types.GET_REPORTS, testId }
);

export const getLastReports = () => (
  { type: Types.GET_LAST_REPORTS }
);

export const getReportsSuccess = (reports) => (
  { type: Types.GET_REPORTS_SUCCESS, reports }
);

export const getReportsFaliure = (error) => (
  { type: Types.GET_REPORTS_FAILURE, error }
);

export const clearErrorOnGetReports = () => (
  { type: Types.CLEAR_ERROR_ON_GET_REPORTS }
);

export const clearReports = () => (
  { type: Types.CLEAR_REPORTS }
);

export const getReport = (testId, runId) => (
  { type: Types.GET_REPORT, testId, runId }
);

export const getReportSuccess = (report) => (
  { type: Types.GET_REPORT_SUCCESS, report }
);

export const getReportFaliure = (error) => (
  { type: Types.GET_REPORT_FAILURE, error }
);

export const clearSelectedReport = () => (
  { type: Types.CLEAR_SELECTED_REPORT }
);

export const processingGetReports = (state) => (
  { type: Types.PROCESSING_GET_REPORTS, state }
);


export const getAggregateReport = (testId,reportId) => (
  { type: Types.GET_AGGREGATE_REPORT, testId,reportId }
);


export const getAggregateReportSuccess = (data) => (
  { type: Types.GET_AGGREGATE_REPORT_SUCCESS, data }
);

