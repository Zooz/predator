import {put, takeLatest, call} from 'redux-saga/effects'
import * as Actions from '../actions/webhooksActions'
import * as Types from '../types/webhooks'
import {getWebhooksApi, createWebhookApi, editWebhookApi, deleteWebhookApi} from '../apis/webhooksApi'

export function* getWebhooks() {
    try {
        yield put(Actions.setLoading(true));
        const result = yield call(getWebhooksApi);
        yield put(Actions.getWebhooksSuccess(result.data));
    } catch (e) {
        yield put(Actions.getWebHookFailure(e))
    }
    yield put(Actions.setLoading(false));
}

export function* createWebhook({body}) {
    try {
        yield put(Actions.setLoading(true));
        const result = yield call(createWebhookApi, body);
        yield put(Actions.createWebHookSuccess(true));
    } catch (e) {
        yield put(Actions.createWebHookFailure(e))

    }
    yield put(Actions.setLoading(false));
}

export function* editWebhook({body, id}) {
    try {
        yield put(Actions.setLoading(true));
        const result = yield call(editWebhookApi, body, id);
        yield put(Actions.editWebHookSuccess(true));
    } catch (e) {
        yield put(Actions.editWebHookFailure(e))

    }
    yield put(Actions.setLoading(false));
}

export function* deleteWebhook({id}) {
    try {
        yield put(Actions.setLoading(true));
        const result = yield call(deleteWebhookApi, id);
        yield put(Actions.deleteWebHookSuccess(true));
    } catch (e) {
        yield put(Actions.deleteWebHookFailure(e))

    }
    yield put(Actions.setLoading(false));
}

export function* webhooksRegister() {
    yield takeLatest(Types.GET_WEBHOOKS, getWebhooks);
    yield takeLatest(Types.CREATE_WEBHOOK, createWebhook);
    yield takeLatest(Types.EDIT_WEBHOOK, editWebhook);
    yield takeLatest(Types.DELETE_WEBHOOK, deleteWebhook);
}
