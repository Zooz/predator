import {put, takeLatest, select, all, call} from 'redux-saga/effects'
import * as Actions from '../actions/reportsActions'
import * as Types from '../types/reportsTypes'
import {
    getReportsFromFramework,
    getReportFromFramework,
    getLastReportsFromFramework,
    getAggregateFromFramework,
    createBenchmarkFromFramework,
    editReportFromFramework,
    getBenchmarkFromFramework,
    deleteReportFromFramework
} from '../apis/reportsApi'

export function* getReports({testId}) {
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

export function* getLastReports() {
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

export function* getReport({testId, runId}) {
    try {
        const report = yield call(getReportFromFramework, testId, runId);
        yield put(Actions.getReportSuccess(report.data));
    } catch (e) {
        yield put(Actions.getReportFaliure(e))
    }
}

export function* createBenchmark({testId, body}) {
    try {
        yield call(createBenchmarkFromFramework, testId, body);
        yield put(Actions.createBenchmarkSuccess(true));
    } catch (e) {
        yield put(Actions.createBenchmarkFailure(e))
    }
}

export function* editReport({testId, reportId, body}) {
    try {
        yield call(editReportFromFramework, testId, reportId, body);
        yield put(Actions.editReportSuccess(true));
    } catch (e) {
        yield put(Actions.editReportFailure(e))
    }
}

export function* deleteReports({selectedReports}) {
    try {
        yield  all(selectedReports.map(({testId, reportId}) => call(deleteReportFromFramework, testId, reportId)));
        yield put(Actions.deleteReportSuccess(true));
    } catch (e) {
        yield put(Actions.deleteReportFailure(e))
    }
}

export function* getAggregateReports({reportsData}) {
    try {
        const results = yield all(reportsData.map(report => {
            return call(getAggregateFromFramework, report.testId, report.reportId)
        }));

        const data = results.map((result) => result.data);
        yield put(Actions.getAggregateReportSuccess(data));
    } catch (e) {
        console.log('error', e);
        //TODO
        // yield put(Actions.getReportFaliure(e))
    }
}


export function* getBenchmark({testId}) {
    try {
        const result = yield call(getBenchmarkFromFramework, testId);
        yield put(Actions.getBenchmarkSuccess(result.data));
    } catch (e) {
        console.log('error', e);
    }
}


export function* reportsRegister() {
    yield takeLatest(Types.GET_REPORTS, getReports);
    yield takeLatest(Types.GET_REPORT, getReport);
    yield takeLatest(Types.GET_LAST_REPORTS, getLastReports);
    yield takeLatest(Types.GET_AGGREGATE_REPORTS, getAggregateReports);
    yield takeLatest(Types.CREATE_BENCHMARK, createBenchmark);
    yield takeLatest(Types.EDIT_REPORT, editReport);
    yield takeLatest(Types.GET_BENCHMARK, getBenchmark);
    yield takeLatest(Types.DELETE_REPORT, deleteReports);
}
