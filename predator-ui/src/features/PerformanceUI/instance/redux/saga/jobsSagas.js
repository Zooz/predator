import { put, takeEvery, takeLatest, select, call } from 'redux-saga/effects'
import * as Actions from '../actions/jobsActions'
import * as Types from '../types/jobsTypes'
import { getJobsFromFramework, getJobFromFramework, createJobInFramework, stopRunningJobInFramework, deleteJobInFramework } from '../apis/jobsApi';
import { stopTest } from './testsSagas';

export function * getJobs () {
  try {
    yield put(Actions.processingGetJobs(true));
    let allJobs = yield call(getJobsFromFramework);
    let JobsPagination = allJobs;
    let testsData = allJobs.data;
    let nextUrl = JobsPagination.data.next;
    while (nextUrl) {
      let char = nextUrl.indexOf('?');
      let newURL = nextUrl.substring(char);
      JobsPagination = yield call(getJobsFromFramework, newURL);
      let paginationData = JobsPagination.data;
      nextUrl = JobsPagination.data.next;
      testsData = testsData.concat(paginationData);
    }
    yield put(Actions.getJobsSuccess(testsData));
    yield put(Actions.processingGetJobs(false));
  } catch (e) {
    yield put(Actions.getJobsFaliure(e));
    yield put(Actions.processingGetJobs(false));
  }
}

export function * getJob ({ jobId }) {
  try {
    const job = yield call(getJobFromFramework, jobId);
    yield put(Actions.getJobSuccess(job.data))
  } catch (e) {
    yield put(Actions.getJobFaliure(e))
  }
}

export function * createJob ({ body }) {
  try {
    yield put(Actions.processingCreateJob(true));
    let job = yield call(createJobInFramework, body);
    yield put(Actions.createJobSuccess(job.data));
    yield put(Actions.processingCreateJob(false));
  } catch (e) {
    yield put(Actions.processingCreateJob(false));
    yield put(Actions.createJobFailure(e))
  }
}

export function * stopRunningJob ({ jobId, runId }) {
  try {
    const job = yield call(stopRunningJobInFramework, jobId, runId);
    yield put(Actions.stopRunningJobSuccess(true))
  } catch (e) {
    yield put(Actions.stopRunningJobFailure(e));
  }
}

export function * deleteJob ({ jobId }) {
  try {
    yield put(Actions.processingDeleteJob(true));
    yield call(deleteJobInFramework, jobId);
    yield put(Actions.deleteJobSuccess());
    yield put(Actions.processingDeleteJob(false));
  } catch (e) {
    yield put(Actions.processingDeleteJob(false));
    yield put(Actions.deleteJobFailure(e))
  }
}

export function * jobsRegister () {
  yield takeLatest(Types.GET_JOBS, getJobs);
  yield takeLatest(Types.GET_JOB, getJob);
  yield takeEvery(Types.CREATE_JOB, createJob);
  yield takeLatest(Types.STOP_RUNNING_JOB, stopRunningJob);
  yield takeLatest(Types.DELETE_JOB, deleteJob);
}
