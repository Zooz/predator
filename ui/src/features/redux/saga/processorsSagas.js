import {put, takeEvery, takeLatest, select, call} from 'redux-saga/effects';
import * as Actions from '../actions/processorsActions';
import * as Types from '../types/processorsTypes';
import {getProcessorsApi} from '../apis/processorsApi';

export function* getProcessors() {
    try {
        yield put(Actions.processorsLoading(true));
        const allProcessors = yield call(getProcessorsApi);
        yield put(Actions.getProcessorsSuccess(allProcessors));
    } catch (err) {
      yield put(Actions.processorsFailure(err));
    }
    yield put(Actions.processorsLoading(false));

}


export function* processorsRegister() {
    yield takeLatest(Types.GET_PROCESSORS, getProcessors);
}

