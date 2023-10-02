import { put, takeLatest, call } from 'redux-saga/effects';
import * as Actions from '../actions/chaosExperimentsActions';
import * as Types from '../types/chaosExperimentsTypes';
import {
  getChaosExperimentsApi,
  createChaosExperimentApi,
  deleteChaosExperimentApi,
  updateChaosExperimentApi
} from '../apis/chaosExperimentsApi';

export function * createChaosExperiment (action) {
  try {
    yield put(Actions.chaosExperimentsLoading(true));
    const { data } = yield call(createChaosExperimentApi, action.body);
    yield put(Actions.createChaosExperimentSuccess(data));
    yield put(Actions.getChaosExperiments());
  } catch (err) {
    yield put(Actions.getChaosExperimentsFailure(err));
  }
  yield put(Actions.chaosExperimentsLoading(false));
}

export function * updateChaosExperiment (action) {
  try {
    yield put(Actions.chaosExperimentsLoading(true));
    const { data } = yield call(updateChaosExperimentApi, action.id, action.body);
    yield put(Actions.updateChaosExperimentSuccess(data));
    yield put(Actions.getChaosExperiments());
  } catch (err) {
    yield put(Actions.getChaosExperimentsFailure(err));
  }
  yield put(Actions.chaosExperimentsLoading(false));
}

export function * getChaosExperiments (action) {
  try {
    yield put(Actions.chaosExperimentsLoading(true));
    const { data } = yield call(getChaosExperimentsApi, action.params);
    yield put(Actions.getChaosExperimentsSuccess(data));
  } catch (err) {
    yield put(Actions.getChaosExperimentsFailure(err));
  }
  yield put(Actions.chaosExperimentsLoading(false));
}

export function * deleteChaosExperiment (action) {
  try {
    yield put(Actions.chaosExperimentsLoading(true));
    yield call(deleteChaosExperimentApi, action.id);
    yield put(Actions.deleteChaosExperimentSuccess(true));
    yield put(Actions.getChaosExperiments());
  } catch (err) {
    yield put(Actions.deleteChaosExperimentFailure(err));
  }
  yield put(Actions.chaosExperimentsLoading(false));
}

export function * chaosExperimentsRegister () {
  yield takeLatest(Types.GET_CHAOS_EXPERIMENTS, getChaosExperiments);
  yield takeLatest(Types.CREATE_CHAOS_EXPERIMENT, createChaosExperiment);
  yield takeLatest(Types.UPDATE_CHAOS_EXPERIMENT, updateChaosExperiment);
  yield takeLatest(Types.DELETE_CHAOS_EXPERIMENT, deleteChaosExperiment);
}
