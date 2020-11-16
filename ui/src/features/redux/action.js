import {
    getTest,
    initCreateTestForm,
    editTest,
    cleanAllErrors,
    clearAllSuccessOperationsState,
    deleteTest,
    deleteTestFailure,
    deleteTestSuccess,
    clearErrorOnDeleteTest,
    getTests,
    getTestsSuccess,
    getTestFaliure,
    chooseTest,
    processingGetTests,
    clearSelectedTest,
    clearErrorOnGetTests,
    clearTests,
    getTestsFaliure,
    getTestSuccess,
    createTest,
    getFileMetadata,
    getFileMetadataSuccess,
} from './actions/testsActions';
import {
    getWebhooks,
    createWebhook,
    createWebHookSuccess,
    cleanErrors,
    editWebhook,
    testWebhook,
    deleteWebHook,
    deleteWebHookSuccess,
    editWebHookSuccess,
    testWebHookSuccess,
} from './actions/webhooksActions';
import {
    clearStopJobSuccess,
    clearDeleteJobSuccess,
    deleteJob,
    deleteJobFailure,
    deleteJobSuccess,
    clearErrorOnDeleteJob,
    clearErrorOnStopJob,
    stopRunningJob,
    stopRunningJobSuccess,
    stopRunningJobFailure,
    createJobSuccess,
    createJobFailure,
    processingCreateJob,
    clearErrorOnCreateJob,
    createJob,
    editJob,
    getJobsFaliure,
    processingGetJobs,
    getJobsSuccess,
    getJobs,
    getJob,
    clearErrorOnGetJobs,
    clearSelectedJob,
    getJobFaliure,
    getJobSuccess,
    editJobSuccess,
    editJobId,
    clearErrorOnJobAction
} from './actions/jobsActions';
import {
    getLastReports,
    getReport,
    clearErrorOnGetReports,
    clearReports,
    clearSelectedReport,
    getReportFailure,
    getReports,
    getReportsFaliure,
    getReportsSuccess,
    getReportSuccess,
    processingGetReports,
    editReport,
    editReportSuccess,
    cleanAllReportsErrors,
    addReportForCompare,
    clearSelectedReports,
    deleteReports,
    deleteReportSuccess,
    deleteReportFailure,
} from './actions/reportsActions';
import {
    updateConfig,
    clearUpdateConfigError,
    processGetConfig,
    processUpdateConfig,
    getConfigDataMapSuccess,
    getConfigSuccess,
    getConfigDataMap,
    getConfigFailure,
    getConfig,
    updateConfigFailure,
    updateConfigSuccess,
    deleteConfigKey,
    cleanUpdateConfigSuccess,
    cleanFinishedContainers,
  cleanFinishedContainersSuccess,
    cleanFinishedContainersFailure
} from './actions/configActions';

export {
    // tests//
    getTest,
    initCreateTestForm,
    editTest,
    cleanAllErrors,
    getTests,
    getTestsSuccess,
    getTestFaliure,
    chooseTest,
    processingGetTests,
    clearSelectedTest,
    clearErrorOnGetTests,
    clearTests,
    getTestsFaliure,
    getTestSuccess,
    deleteTest,
    deleteTestSuccess,
    deleteTestFailure,
    clearErrorOnDeleteTest,
    clearAllSuccessOperationsState,
    createTest,
    getFileMetadata,
    getFileMetadataSuccess,
    // jobs//
    getJobsFaliure,
    processingGetJobs,
    getJobsSuccess,
    getJobs,
    getJob,
    clearErrorOnGetJobs,
    clearSelectedJob,
    getJobFaliure,
    getJobSuccess,
    createJobFailure,
    processingCreateJob,
    clearErrorOnCreateJob,
    createJob,
    editJob,
    editJobSuccess,
    editJobId,
    createJobSuccess,
    stopRunningJob,
    stopRunningJobSuccess,
    stopRunningJobFailure,
    clearErrorOnStopJob,
    deleteJob,
    deleteJobSuccess,
    deleteJobFailure,
    clearErrorOnDeleteJob,
    clearDeleteJobSuccess,
    clearStopJobSuccess,
    clearErrorOnJobAction,
    // reports//
    getReport,
    clearErrorOnGetReports,
    clearReports,
    clearSelectedReport,
    getReportFailure,
    getReports,
    getReportsFaliure,
    getReportsSuccess,
    getReportSuccess,
    processingGetReports,
    getLastReports,
    editReport,
    editReportSuccess,
    cleanAllReportsErrors,
    addReportForCompare,
    clearSelectedReports,
    deleteReports,
    deleteReportSuccess,
    deleteReportFailure,
    //config
    getConfigDataMapSuccess,
    getConfigSuccess,
    getConfigDataMap,
    getConfigFailure,
    getConfig,
    updateConfigFailure,
    updateConfigSuccess,
    updateConfig,
    processGetConfig,
    processUpdateConfig,
    clearUpdateConfigError,
    deleteConfigKey,
    cleanUpdateConfigSuccess,
    cleanFinishedContainers,
    cleanFinishedContainersSuccess,
    cleanFinishedContainersFailure,
    //webhooks
    getWebhooks,
    createWebhook,
    createWebHookSuccess,
    cleanErrors,
    editWebhook,
    testWebhook,
    deleteWebHook,
    deleteWebHookSuccess,
    editWebHookSuccess,
    testWebHookSuccess

};
//processors

export * from './actions/processorsActions';

