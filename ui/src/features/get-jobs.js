import React from 'react';
import { connect } from 'react-redux';
import Snackbar from 'material-ui/Snackbar';
import {
    job,
    processingGetJobs,
    errorOnGetJobs,
    processingDeleteJob,
    deleteJobSuccess,
    getJobsWithTestNameAndLastRun,
    createJobSuccess,
    editJobSuccess,
    errorOnJobAction
} from './redux/selectors/jobsSelector';
import { tests } from './redux/selectors/testsSelector';
import { reports } from './redux/selectors/reportsSelector';
import style from './style.scss';
import Dialog from './components/Dialog';
import DeleteDialog from './components/DeleteDialog';
import * as Actions from './redux/action';
import Loader from './components/Loader';
import Page from '../components/Page';
import { ReactTableComponent } from '../components/ReactTable';
import { getColumns } from './configurationColumn';
import _ from 'lodash';
import { createJobRequest } from './components/JobForm/utils';
import JobForm from './components/JobForm';

const noDataMsg = 'There is no data to display.';
const errorMsgGetTests = 'Error occurred while trying to get all jobs.';
const REFRESH_DATA_INTERVAL = 30000;
const columnsNames = ['test_name', 'duration', 'arrival_rate', 'ramp_to', 'parallelism', 'max_virtual_users', 'cron_expression', 'last_run', 'run_now', 'job_edit', 'raw', 'delete', 'enabled_disabled'];
const DESCRIPTION = 'Scheduled jobs configured with a cron expression.';

class getJobs extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            openSnakeBar: false,
            deleteDialog: false,
            openViewJob: false,
            jobToDelete: undefined,
            sortedJobs: [],
            rerunJob: null,
            editJob: null,
            openViewEditJob: false,
            jobForEdit: null
        };
    }

    componentDidUpdate(prevProps) {
        if (prevProps.jobs !== this.props.jobs) {
            this.setState({ sortedJobs: [...this.props.jobs] });
            const { match: { params, path } } = this.props;
            if (path === '/jobs/:jobId/edit') {
                const data = this.props.jobs.find((job) => job.id === params.jobId);
                data && this.onEdit(data);
            }
        }
    }

    onSearch = (value) => {
        if (!value) {
            this.setState({ sortedJobs: [...this.props.jobs] });
        }
        const newSorted = _.filter(this.props.jobs, (job) => {
            return (_.includes(String(job.test_name).toLowerCase(), value.toLowerCase()) ||
                _.includes(String(job.environment).toLowerCase(), value.toLowerCase()));
        });
        this.setState({ sortedJobs: newSorted });
    };

    onDelete = (data) => {
        this.setState({
            deleteDialog: true,
            jobToDelete: data
        });
    };

    onRawView = (job) => {
        this.setState({ openViewJob: job });
    };

    onEdit = (data) => {
        const { match: { params, path }, history } = this.props;
        if (path !== '/jobs/:jobId/edit') {
          history.replace(`/jobs/${data.id}/edit`)
        }
        this.setState({ openViewEditJob: true, jobForEdit: data });
    };

    onRunTest = (job) => {
        const request = createJobRequest(job);
        delete request.cron_expression;
        request.run_immediately = true;
        this.props.createJob(request);
        this.setState({rerunJob: job});
    };

    onEnableDisable = (data, value) => {
        const request = {enabled: value};
        this.setState({editJob:data});
        this.props.editJob(data.id, request);
    };

    submitDelete = () => {
        this.props.deleteJob(this.state.jobToDelete.id);
        this.props.getAllJobs();
        this.setState({
            deleteDialog: false
        });
    };

    clearDeleteError = () => {
        this.props.getAllJobs();
        this.props.clearErrorOnDelete();
    };

    cancelDelete = () => {
        this.setState({
            deleteDialog: false
        });

        this.props.deleteError ? this.clearDeleteError() : undefined;
    };

    closeViewJobDialog = () => {
        this.setState({
            openViewJob: false
        });
        this.props.clearSelectedJob();
    };

    componentDidMount() {
        this.loadPageData();
        this.refreshDataInterval = setInterval(this.loadPageData, REFRESH_DATA_INTERVAL);
    }

    loadPageData = () => {
        this.props.getTests();
        this.props.getAllReports();
        this.props.clearErrorOnGetJobs();
        this.props.getAllJobs();
    };

    componentWillUnmount() {
        this.props.clearErrorOnGetJobs();
        this.props.clearSelectedJob();
        clearInterval(this.refreshDataInterval);
    }

    loader() {
        return this.props.processingGetJobs ? <Loader /> : noDataMsg;
    }

    closeViewEditJobDialog = () => {
        const { history } = this.props;
        history.replace('/jobs');
        this.setState({ openViewEditJob: false, jobForEdit: null });
    }

    render() {
        const noDataText = this.props.errorOnGetJobs ? errorMsgGetTests : this.loader();

        const { sortedJobs, jobForEdit } = this.state;
        const columns = getColumns({
            columnsNames,
            onSort: this.onSort,
            onRawView: this.onRawView,
            onRunTest: this.onRunTest,
            onDelete: this.onDelete,
            onEnableDisable: this.onEnableDisable,
            onEdit: this.onEdit
        });
        const feedbackMessage = this.generateFeedbackMessage();
        return (
            <Page title={'Scheduled Jobs'} description={DESCRIPTION}>
                <ReactTableComponent
                    // tableRowId={'report_id'}
                onSearch={this.onSearch}
                rowHeight={'46px'}
                    manual={false}
                    data={sortedJobs}
                    pageSize={10}
                    columns={columns}
                    noDataText={noDataText}
                    showPagination
                    resizable={false}
                    cursor={'default'}
                />

                {this.state.openViewJob
                    ? <Dialog title_key={'id'} data={this.state.openViewJob}
                      closeDialog={this.closeViewJobDialog} /> : null}
                {this.state.openViewEditJob &&
                    <JobForm history={history} editMode={true} data={jobForEdit} closeDialog={this.closeViewEditJobDialog}
                />}
            {this.state.deleteDialog && !this.props.deleteJobSuccess
                    ? <DeleteDialog loader={this.props.processingDeleteJob}
                      display={this.state.jobToDelete ? `job ${this.state.jobToDelete.id}` : ''}
                      onSubmit={this.submitDelete} errorOnDelete={this.props.deleteError}
                      onCancel={this.cancelDelete} /> : null}
                {feedbackMessage && <Snackbar
                    open={!!(this.props.deleteJobSuccess || this.props.jobSuccess || this.props.editJobSuccess)}
                    bodyStyle={{ backgroundColor: '#2fbb67' }}
                    message={feedbackMessage}
                    autoHideDuration={4000}
                    onRequestClose={() => {
                        this.props.getAllJobs();
                        this.props.clearDeleteJobSuccess();
                        this.props.createJobSuccess(undefined);
                        this.props.setEditJobSuccess(undefined);
                        this.setState({
                            jobToDelete: undefined,
                            rerunJob: null,
                            editJob: null,
                        });
                    }}
                />}
          </Page>
        );
    }

    generateFeedbackMessage = ()=>{
        if(this.state.jobToDelete && this.state.jobToDelete.id){
            return `Job deleted successfully: ${this.state.jobToDelete.id}`
        }
        if(this.props.jobSuccess && this.state.rerunJob){
            return `Job created successfully: ${this.props.jobSuccess.id}`;
        }
        if(this.props.editJobSuccess  && this.state.editJob){
            return `Job edited successfully: ${this.state.editJob.id}`;
        }

    }
}

function mapStateToProps(state) {
    return {
        jobs: getJobsWithTestNameAndLastRun(state),
        job: job(state),
        processingGetJobs: processingGetJobs(state),
        errorOnGetJobs: errorOnGetJobs(state),
        processingDeleteJob: processingDeleteJob(state),
        deleteJobSuccess: deleteJobSuccess(state),
        tests: tests(state),
        reports: reports(state),
        jobSuccess: createJobSuccess(state),
        editJobSuccess:  editJobSuccess(state),
        errorOnJobAction:errorOnJobAction(state)
    };
}

const mapDispatchToProps = {
    clearSelectedJob: Actions.clearSelectedJob,
    clearErrorOnGetJobs: Actions.clearErrorOnGetJobs,
    getAllJobs: Actions.getJobs,
    getJob: Actions.getJob,
    createJob: Actions.createJob,
    editJob: Actions.editJob,
    deleteJob: Actions.deleteJob,
    clearDeleteJobSuccess: Actions.clearDeleteJobSuccess,
    clearErrorOnDeleteJob: Actions.clearErrorOnDeleteJob,
    getTests: Actions.getTests,
    getAllReports: Actions.getLastReports,
    createJobSuccess: Actions.createJobSuccess,
    setEditJobSuccess: Actions.editJobSuccess,
};

export default connect(mapStateToProps, mapDispatchToProps)(getJobs);
