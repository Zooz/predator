import {
    getTest,
    initCreateTestForm,
    editTest,
    cleanAllErrors,
    clearDeleteTestSuccess,
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
    createTest
} from './actions/testsActions';
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
    editJobSuccess
} from './actions/jobsActions';
import {
    getLastReports,
    getReport,
    clearErrorOnGetReports,
    clearReports,
    clearSelectedReport,
    getReportFaliure,
    getReports,
    getReportsFaliure,
    getReportsSuccess,
    getReportSuccess,
    processingGetReports
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
    clearDeleteTestSuccess,
    createTest,
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

    // reports//
    getReport,
    clearErrorOnGetReports,
    clearReports,
    clearSelectedReport,
    getReportFaliure,
    getReports,
    getReportsFaliure,
    getReportsSuccess,
    getReportSuccess,
    processingGetReports,
    getLastReports,

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
    cleanFinishedContainersFailure

};
//processors

export * from './actions/processorsActions';

