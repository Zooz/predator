import {createSelector} from 'reselect'
import {tests} from './testsSelector';
import {reports} from './reportsSelector';
export const jobs = (state) => state.JobsReducer.get('jobs');
export const errorOnGetJobs = (state) => state.JobsReducer.get('error_get_jobs');
export const job = (state) => state.JobsReducer.get('job');
export const processingGetJobs = (state) => state.JobsReducer.get('processing_get_jobs');
export const processingCreateJob = (state) => state.JobsReducer.get('processing_create_job');
export const errorOnNewJob = (state) => state.JobsReducer.get('error_new_job');
export const createJobSuccess = (state) => state.JobsReducer.get('job');
export const editJobSuccess = (state) => state.JobsReducer.get('edit_job_success');
export const errorOnJobAction = (state) => state.JobsReducer.get('error_on_job_action');
export const createJobFailure = (state) => state.JobsReducer.get('error_create_job');
export const errorOnStopRunningJob = (state) => state.JobsReducer.get('error_stop_job');
export const processingDeleteJob = (state) => state.JobsReducer.get('processing_delete_job');
export const deleteJobSuccess = (state) => state.JobsReducer.get('delete_job_success');
export const stopRunningJobSuccess = (state) => state.JobsReducer.get('stop_job_success');


export const getJobsWithTestNameAndLastRun = createSelector([jobs, tests,reports], (jobs, tests,reports) => {
    return jobs.map((job) => {
        const test = tests.find((test) => test.id === job.test_id);
        const report = reports.find((report)=>(report.job_id===job.id));
        let test_name = 'N/A',last_run = 'N/A';
        if (test) {
            test_name = test.name;
        }
        if (report){
            last_run=report.start_time;
        }
        return {
            ...job,
            test_name,
            last_run
        }
    })
});
