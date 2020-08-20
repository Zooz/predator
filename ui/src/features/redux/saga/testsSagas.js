import {put, takeEvery, takeLatest, select, call} from 'redux-saga/effects';
import * as Actions from '../actions/testsActions';
import * as Types from '../types/testsTypes';
import {
    editTestInFramework,
    getTestsFromFramework,
    getTestFromFramework,
    deleteTestInFramework,
    createTestInFramework,
    createFileInFramework,
    getFileMetadataInFramework
} from '../apis/testsApi';

export function* getTests() {
    try {
        yield put(Actions.processingGetTests(true));
        let allTests = yield call(getTestsFromFramework);
        let TestsPagination = allTests;
        let testsData = allTests.data;
        let nextUrl = TestsPagination.data.next;
        while (nextUrl) {
            let char = nextUrl.indexOf('?');
            let newURL = nextUrl.substring(char);
            TestsPagination = yield call(getTestsFromFramework, newURL);
            let paginationData = TestsPagination.data;
            nextUrl = TestsPagination.data.next;
            testsData = testsData.concat(paginationData);
        }
        yield put(Actions.getTestsSuccess(testsData));
        yield put(Actions.processingGetTests(false));
    } catch (e) {
        yield put(Actions.getTestsFaliure(e));
        yield put(Actions.processingGetTests(false));
    }
}

export function* getTest({testId}) {
    try {
        const test = yield call(getTestFromFramework, testId, token);
        yield put(Actions.getTestSuccess(test.data))

    } catch (e) {
        yield put(Actions.getTestFaliure(e));
    }
}

export function* getFileMetadata({fileId}) {
    try {
        const result = yield call(getFileMetadataInFramework, fileId);
        yield put(Actions.getFileMetadataSuccess(result.data))
    } catch (e) {
        console.log("error",e)
    }
}

export function* createTest(action) {
    try {
        yield put(Actions.setLoading(true));
        let csvFileId;
        if (action.file) {
            const fileResult = yield call(createFileInFramework, action.file);
            csvFileId = fileResult.data.id;
        }
        const body = {csv_file_id: csvFileId, ...action.body};
        const result = yield call(createTestInFramework, body);
        yield put(Actions.createTestSuccess());
        yield call(getTests);
    } catch (err) {
        yield put(Actions.createTestFailure(err));
    }
    yield put(Actions.setLoading(false));
}

export function* cloneTest(action) {
    try {
        yield put(Actions.setLoading(true));
        const result = yield call(createTestInFramework, action.body);
        yield put(Actions.cloneTestSuccess());
        yield call(getTests);
    } catch (err) {
        yield put(Actions.cloneTestFailure(err));
    }
    yield put(Actions.setLoading(false));
}

export function* editTest(action) {
    try {
        yield put(Actions.setLoading(true));
        let  csvFileId=action.body.csv_file_id;
        if (action.file) {
            const fileResult = yield call(createFileInFramework, action.file);
            csvFileId = fileResult.data.id;
        }
        const body = { ...action.body,csv_file_id: csvFileId};

        yield call(editTestInFramework, body, action.id);
        yield put(Actions.createTestSuccess());
        yield call(getTests);
    } catch (err) {
        yield put(Actions.createTestFailure(err));
    }
    yield put(Actions.setLoading(false));
}


export function* deleteTest({testId}) {
    try {
        yield call(deleteTestInFramework, testId);
        yield put(Actions.deleteTestSuccess());
        yield call(getTests);
    } catch (e) {
        yield put(Actions.deleteTestFailure(e))
    }
}

export function* uploadFile({testId}) {
    try {
        yield call(deleteTestInFramework, testId);
        yield put(Actions.deleteTestSuccess())
    } catch (e) {
        yield put(Actions.deleteTestFailure(e))
    }
}

export function* testsRegister() {
    yield takeLatest(Types.GET_TESTS, getTests);
    yield takeLatest(Types.GET_TEST, getTest);
    yield takeLatest(Types.GET_FILE_METADATA, getFileMetadata);
    yield takeLatest(Types.CREATE_TEST, createTest);
    yield takeLatest(Types.CLONE_TEST, cloneTest);
    yield takeLatest(Types.DELETE_TEST, deleteTest);
    yield takeLatest(Types.EDIT_TEST, editTest);
}

