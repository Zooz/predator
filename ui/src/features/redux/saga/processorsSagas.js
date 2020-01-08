import {put, takeEvery, takeLatest, select, call} from 'redux-saga/effects';
import * as Actions from '../actions/processorsActions';
import * as Types from '../types/processorsTypes';
import {getProcessorsApi, createProcessorApi, deleteProcessorApi, editProcessorApi} from '../apis/processorsApi';

export function* createProcessor(action) {
    try {
        yield put(Actions.processorsLoading(true));
        const {data} = yield call(createProcessorApi, action.body);
        yield put(Actions.createProcessorSuccess(data));
        yield put(Actions.getProcessors());
    } catch (err) {
        yield put(Actions.processorsFailure(err));
    }
    yield put(Actions.processorsLoading(false));

}

export function* getProcessors() {
    try {
        yield put(Actions.processorsLoading(true));
        const {data} = yield call(getProcessorsApi);
        yield put(Actions.getProcessorsSuccess(data));
    } catch (err) {
        yield put(Actions.processorsFailure(err));
    }
    yield put(Actions.processorsLoading(false));

}

export function* deleteProcessor(action) {
    try {
        yield put(Actions.processorsLoading(true));
        yield call(deleteProcessorApi, action.id);
        yield put(Actions.deleteProcessorSuccess(true));
        yield put(Actions.getProcessors());
    } catch (err) {
        console.log('manor err', err)
        yield put(Actions.deleteProcessorFailure(err));
    }
    yield put(Actions.processorsLoading(false));

}

export function* editProcessor(action) {
    try {
        yield put(Actions.processorsLoading(true));
        yield call(editProcessorApi, action.id,action.body);
        yield put(Actions.editProcessorSuccess(true));
        yield put(Actions.getProcessors());
    } catch (err) {
        console.log('manor err', err)
        yield put(Actions.editProcessorFailure(err));
    }
    yield put(Actions.processorsLoading(false));

}


export function* processorsRegister() {
    yield takeLatest(Types.GET_PROCESSORS, getProcessors);
    yield takeLatest(Types.CREATE_PROCESSOR, createProcessor);
    yield takeLatest(Types.DELETE_PROCESSOR, deleteProcessor);
    yield takeLatest(Types.EDIT_PROCESSOR, editProcessor);
}

