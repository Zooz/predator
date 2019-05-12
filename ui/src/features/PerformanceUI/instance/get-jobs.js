import React from 'react';
import { connect } from 'react-redux';
import Snackbar from 'material-ui/Snackbar';
import {
    job,
    processingGetJobs,
    errorOnGetJobs,
    errorOnGetJob,
    processingDeleteJob,
    deleteJobSuccess,
    getJobsWithTestNameAndLastRun
} from './redux/selectors/jobsSelector';
import { tests } from './redux/selectors/testsSelector';
import { reports } from './redux/selectors/reportsSelector';
import style from './style.scss';
import Dialog from '../components/Dialog';
import DeleteDialog from '../components/DeleteDialog';
import * as Actions from './redux/action';
import Loader from '../components/Loader';
import Page from '../../../components/Page';
import { ReactTableComponent } from '../../../components/ReactTable';
import { getColumns } from './configurationColumn';
import _ from 'lodash';

const noDataMsg = 'There is no data to display.';
const errorMsgGetTests = 'Error occurred while trying to get all jobs.';
const REFRESH_DATA_INTERVAL = 30000;
const columnsNames = ['test_name', 'environment', 'duration', 'arrival_rate', 'ramp_to', 'parallelism', 'max_virtual_users', 'cron_expression', 'last_run', 'raw', 'delete'];
const DESCRIPTION = 'Scheduled jobs configured with a cron expression.';

class getJobs extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            openSnakeBar: false,
            deleteDialog: false,
            openViewJob: false,
            jobToDelete: undefined,
            sortedJobs: []
        };
    }

    componentDidUpdate(prevProps) {
        if (prevProps.jobs !== this.props.jobs) {
            this.setState({ sortedJobs: [...this.props.jobs] });
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

    render() {
        const noDataText = this.props.errorOnGetJobs ? errorMsgGetTests : this.loader();

        const { sortedJobs } = this.state;
        const columns = getColumns({
            columnsNames,
            onSort: this.onSort,
            onRawView: this.onRawView,
            onDelete: this.onDelete
        });

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

            {this.state.deleteDialog && !this.props.deleteJobSuccess
                    ? <DeleteDialog loader={this.props.processingDeleteJob}
                      display={this.state.jobToDelete ? `job ${this.state.jobToDelete.id}` : ''}
                      onSubmit={this.submitDelete} errorOnDelete={this.props.deleteError}
                      onCancel={this.cancelDelete} /> : null}
                {/* //TODO seems deleteError will not work */}
                <Snackbar
                    anchorOrigin={{
                        vertical: 'top',
                        horizontal: 'center'
                    }}
                    open={this.props.deleteJobSuccess}
                    bodyStyle={{ backgroundColor: '#2fbb67' }}
                    message={(this.state.jobToDelete && this.state.jobToDelete.id) ? `Job deleted successfully: ${this.state.jobToDelete.id}` : ''}
                    autoHideDuration={4000}
                    onRequestClose={() => {
                        this.props.getAllJobs();
                        this.props.clearDeleteJobSuccess();
                        this.setState({
                            jobToDelete: undefined
                        });
                    }}
                />
          </Page>
        );
    }
}

function mapStateToProps(state) {
    return {
        jobs: getJobsWithTestNameAndLastRun(state),
        job: job(state),
        processingGetJobs: processingGetJobs(state),
        errorOnGetJobs: errorOnGetJobs(state),
        errorOnGetJob: errorOnGetJob(state),
        processingDeleteJob: processingDeleteJob(state),
        deleteJobSuccess: deleteJobSuccess(state),
        tests: tests(state),
        reports: reports(state)
    };
}

const mapDispatchToProps = {
    clearSelectedJob: Actions.clearSelectedJob,
    clearErrorOnGetJobs: Actions.clearErrorOnGetJobs,
    getAllJobs: Actions.getJobs,
    getJob: Actions.getJob,
    deleteJob: Actions.deleteJob,
    clearDeleteJobSuccess: Actions.clearDeleteJobSuccess,
    clearErrorOnDeleteJob: Actions.clearErrorOnDeleteJob,
    getTests: Actions.getTests,
    getAllReports: Actions.getLastReports
};

export default connect(mapStateToProps, mapDispatchToProps)(getJobs);
