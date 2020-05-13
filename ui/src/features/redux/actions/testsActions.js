import * as Types from '../types/testsTypes';

export const getTests = () => (
    {type: Types.GET_TESTS}
);

export const getTestsSuccess = (tests) => (
    {type: Types.GET_TESTS_SUCCESS, tests}
);

export const getTestsFaliure = (error) => (
    {type: Types.GET_TESTS_FAILURE, error}
);

export const clearErrorOnGetTests = () => (
    {type: Types.CLEAR_ERROR_ON_GET_TESTS}
);

export const clearTests = () => (
    {type: Types.CLEAR_TESTS}
);

export const chooseTest = (test) => (
    {type: Types.SET_TEST, test}
);

export const getTestSuccess = (test) => (
    {type: Types.GET_TEST_SUCCESS, test}
);

export const getTestFaliure = (error) => (
    {type: Types.GET_TEST_FAILURE, error}
);

export const clearSelectedTest = () => (
    {type: Types.CLEAR_SELECTED_TEST}
);

export const processingGetTests = (state) => (
    {type: Types.PROCESSING_GET_TESTS, state}
);

export const deleteTest = (testId) => (
    {type: Types.DELETE_TEST, testId}
);

export const deleteTestSuccess = () => (
    {type: Types.DELETE_TEST_SUCCESS}
);

export const deleteTestFailure = (error) => (
    {type: Types.DELETE_TEST_FAILURE, error}
);

export const clearErrorOnDeleteTest = () => (
    {type: Types.CLEAR_ERROR_DELETE_TEST}
);

export const clearDeleteTestSuccess = () => (
    {type: Types.CLEAR_DELETE_TEST_SUCCESS}
);

export const createTest = (body, file) => (
    {type: Types.CREATE_TEST, body, file}
);
export const createTestSuccess = () => (
    {type: Types.CREATE_TEST_SUCCESS}
);
export const createTestFailure = (error) => (
    {type: Types.CREATE_TEST_FAILURE, error}
);

export const cleanAllErrors = () => (
    {type: Types.CLEAN_ALL_ERRORS}
);

export const setLoading = (isLoading) => (
    {type: Types.IS_LOADING, isLoading}
);
export const initCreateTestForm = () => (
    {type: Types.INIT_CREATE_FORM}
);
export const editTest = (body, id) => (
    {type: Types.EDIT_TEST, body, id}
);

export const getTest = (testId) => (
    {type: Types.GET_TEST, testId}
);
