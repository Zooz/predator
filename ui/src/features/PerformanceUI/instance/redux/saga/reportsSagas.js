import { put, takeLatest, select, call } from 'redux-saga/effects'
import * as Actions from '../actions/reportsActions'
import * as Types from '../types/reportsTypes'
import { getReportsFromFramework, getReportFromFramework, getLastReportsFromFramework } from '../apis/reportsApi'

export function * getReports ({ testId }) {
  try {
    yield put(Actions.processingGetReports(true));
    let allReports = yield call(getReportsFromFramework, undefined, testId);
    let reportsPagination = allReports;
    let reportsData = allReports.data;
    let nextUrl = reportsPagination.data.next;
    while (nextUrl) {
      let char = nextUrl.indexOf('?');
      let newURL = nextUrl.substring(char);
      reportsPagination = yield call(getReportsFromFramework, newURL, testId);
      let paginationData = reportsPagination.data;
      nextUrl = reportsPagination.data.next;
      reportsData = reportsData.concat(paginationData);
    }
    yield put(Actions.getReportsSuccess(reportsData));
    yield put(Actions.processingGetReports(false));
  } catch (e) {
    yield put(Actions.getReportsFaliure(e));
    yield put(Actions.processingGetReports(false));
  }
}

export function * getLastReports () {
  try {
    yield put(Actions.processingGetReports(true));
    let allReports = yield call(getLastReportsFromFramework);
    let reportsPagination = allReports;
    let reportsData = allReports.data;
    let nextUrl = reportsPagination.data.next;
    while (nextUrl) {
      let char = nextUrl.indexOf('?');
      let newURL = nextUrl.substring(char);
      reportsPagination = yield call(getLastReportsFromFramework, newURL);
      let paginationData = reportsPagination.data;
      nextUrl = reportsPagination.data.next;
      reportsData = reportsData.concat(paginationData);
    }
    yield put(Actions.getReportsSuccess(reportsData));
    yield put(Actions.processingGetReports(false));
  } catch (e) {
    yield put(Actions.getReportsFaliure(e));
    yield put(Actions.processingGetReports(false));
  }
}

export function * getReport ({ testId, runId }) {
  try {
    const report = yield call(getReportFromFramework, testId, runId);
    yield put(Actions.getReportSuccess(report.data));
  } catch (e) {
    yield put(Actions.getReportFaliure(e))
  }
}

export function * reportsRegister () {
  yield takeLatest(Types.GET_REPORTS, getReports);
  yield takeLatest(Types.GET_REPORT, getReport);
  yield takeLatest(Types.GET_LAST_REPORTS, getLastReports);
}
