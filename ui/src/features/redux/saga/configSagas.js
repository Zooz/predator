import { put, takeLatest, call } from 'redux-saga/effects'
import * as Actions from '../actions/configActions'
import * as Types from '../types/configTypes'
import { getFrameworkConfig, updateFrameworkConfig, deleteFrameworkConfigKey } from '../apis/configApi'

export function * getConfig () {
    try {
        yield put(Actions.processGetConfig(true));
        const config = yield call(getFrameworkConfig);
        yield put(Actions.getConfigSuccess(config.data));
    } catch (e) {
        yield put(Actions.getConfigFailure(e))
    }
    yield put(Actions.processGetConfig(false));
}

export function * editConfig (action) {
    try {
        yield put(Actions.processUpdateConfig(true));
        yield call(updateFrameworkConfig, action.body);
        yield put(Actions.updateConfigSuccess());
        yield call(getFrameworkConfig);
    } catch (err) {
        yield put(Actions.updateConfigFailure(err));
    }
    yield put(Actions.processUpdateConfig(false));
}

export function * deleteConfigKey (action) {
    try {
        yield put(Actions.processDeleteConfigKey(true));
        yield call(deleteFrameworkConfigKey, action.body);
    } catch (err) {
        yield put(Actions.deleteConfigKeyFailure(err));
    }
    yield put(Actions.processDeleteConfigKey(false));
}


export function * configRegister() {
    yield takeLatest(Types.GET_CONFIG, getConfig);
    yield takeLatest(Types.UPDATE_CONFIG, editConfig);
    yield takeLatest(Types.DELETE_CONFIG_KEY, deleteConfigKey);
}