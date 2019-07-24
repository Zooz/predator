import {put, takeLatest, call} from 'redux-saga/effects'
import * as Actions from '../actions/configActions'
import * as Types from '../types/configTypes'
import {getFrameworkConfig, updateFrameworkConfig, deleteFrameworkConfigKey} from '../apis/configApi'
import _ from 'lodash';

export function* getConfig() {
    try {
        yield put(Actions.processGetConfig(true));
        const config = yield call(getFrameworkConfig);
        yield put(Actions.getConfigSuccess(config.data));
    } catch (e) {
        yield put(Actions.getConfigFailure(e))
    }
    yield put(Actions.processGetConfig(false));
}

export function* editConfig(action) {
    try {
        yield put(Actions.processUpdateConfig(true));
        for (let key in action.body) {
            if (!action.body[key] && !_.isNumber(action.body[key]) && !_.isBoolean(action.body[key])) {
                yield call(deleteConfigKey, {key})
            }
        }
        const updateBody = cleanEmptyValues(action.body);
        yield call(updateFrameworkConfig, updateBody);
        yield put(Actions.updateConfigSuccess());
    } catch (err) {
        yield put(Actions.updateConfigFailure(err));
    }
    yield put(Actions.processUpdateConfig(false));
}

export function* deleteConfigKey(action) {
    try {
        yield put(Actions.processDeleteConfigKey(true));
        yield call(deleteFrameworkConfigKey, action.key);
    } catch (err) {
        yield put(Actions.deleteConfigKeyFailure(err));
    }
    yield put(Actions.processDeleteConfigKey(false));
}


function cleanEmptyValues(object) {
    const result = {};
    for (let key in object) {
        if (_.isUndefined(object[key])) {
            result[key] = object[key];
        }
    }
    return result;
}

export function* configRegister() {
    yield takeLatest(Types.GET_CONFIG, getConfig);
    yield takeLatest(Types.UPDATE_CONFIG, editConfig);
    yield takeLatest(Types.DELETE_CONFIG_KEY, deleteConfigKey);
}