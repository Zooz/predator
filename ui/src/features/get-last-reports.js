import React from 'react';
import {connect} from 'react-redux';
import * as selectors from './redux/selectors/reportsSelector';
import {createJobSuccess, errorOnStopRunningJob, stopRunningJobSuccess} from './redux/selectors/jobsSelector';
import Snackbar from 'material-ui/Snackbar';
import style from './style.scss';
import Dialog from './components/Dialog';
import * as Actions from './redux/action';
import Page from '../components/Page';
import _ from 'lodash';
import Report from './components/Report';
import CompareReports from "./components/Report/compareReports";
import {createJobRequest} from './requestBuilder';

import {ReactTableComponent} from './../components/ReactTable';
import {getColumns} from './configurationColumn'
import ErrorDialog from "./components/ErrorDialog";
import Button from "../components/Button";
import Loader from "./components/Loader";
import DeleteDialog from "./components/DeleteDialog";

const REFRESH_DATA_INTERVAL = 30000;

const columnsNames = ['compare', 'test_name', 'start_time', 'end_time', 'duration', 'status', 'arrival_rate',
    'ramp_to', 'last_success_rate', 'avg_rps', 'parallelism', 'notes', 'score', 'report', 'grafana_report', 'rerun', 'raw', 'logs', 'stop'];
const DESCRIPTION = 'Reports give you insight into the performance of your API. Predator generates a report for each test that is executed.';

class getReports extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            showReport: false,
            sortedReports: [],
            sortHeader: '',
            rerunJob: null,
            showCompareReports: false,
            showDeleteReportWarning: false

        };
    }

    componentDidUpdate(prevProps) {
        if (prevProps.reports !== this.props.reports) {
            this.setState({sortedReports: [...this.props.reports]})
        }

        if (prevProps.deleteReportSuccess === false && this.props.deleteReportSuccess) {
            this.loadPageData();
        }

    }


    onRawView = (report) => {
        this.setState({openViewReport: report});
    };

    onRunTest = (job) => {
        const requestBody = createJobRequest(job);
        delete requestBody.cron_expression;
        requestBody.run_immediately = true;
        this.props.createJob(requestBody);
        this.setState({rerunJob: job});
    };


    onEditNote = (testId, reportId, notes) => {
        const {editReport} = this.props;
        editReport(testId, reportId, {notes});
    };
    closeViewReportDialog = () => {
        this.setState({
            openViewReport: false
        });
    };

    onReportView = (report) => {
        this.setState({showReport: report})
    };


    onStop = (row) => {
        this.props.stopRunningJob(row.job_id, row.report_id);
    }


    componentDidMount() {
        this.loadPageData();
        this.refreshDataInterval = setInterval(this.loadPageData, REFRESH_DATA_INTERVAL)
    }

    closeReport = () => {
        this.setState({showReport: null})
    }
    loadPageData = () => {
        this.props.getLastReports();
    };

    componentWillUnmount() {
        this.props.clearSelectedReport();
        clearInterval(this.refreshDataInterval);
        this.props.clearSelectedReports();
    }

    onSort = (field) => {
        const {sortHeader} = this.state;
        let isAsc = false;
        if (sortHeader.includes(field)) {
            isAsc = !sortHeader.includes('+')
        } else {
            isAsc = true;
        }
        let sortedReport;
        if (isAsc) {
            sortedReport = _.chain(this.state.sortedReports).sortBy(field).reverse().value();
        } else {
            sortedReport = _.chain(this.state.sortedReports).sortBy(field).value();
        }
        this.setState({sortedReports: sortedReport, sortHeader: `${field}${isAsc ? '+' : '-'}`})
    };
    onSearch = (value) => {
        if (!value) {
            this.setState({sortedReports: [...this.props.reports]})
        }
        const newSorted = _.filter(this.props.reports, (report) => {
            return (String(report.test_name).toLowerCase().includes(value.toLowerCase()) || String(report.status).toLowerCase().includes(value.toLowerCase()))
        });
        this.setState({sortedReports: newSorted})
    };
    onCloseErrorDialog = () => {
        this.props.cleanAllReportsErrors();
        this.props.clearErrorOnStopJob();

    };
    closeCompareReports = () => {
        this.setState({showCompareReports: false})
    };
    onReportSelected = (testId, reportId, value) => {
        this.props.addReportForCompare(testId, reportId, value);
    };

    loader() {
        return this.props.processingGetReports ? <Loader/> : 'There is no data'
    }

    onDeleteSelectedReports = () => {
        this.setState({showDeleteReportWarning: false})
        this.props.deleteReports(this.props.selectedReportsAsArray)

    };


    render() {
        const {showReport, sortHeader, sortedReports, showCompareReports} = this.state;
        const {
            errorOnGetReports,
            errorOnGetReport,
            errorOnStopRunningJob,
            errorCreateBenchmark,
            errorEditReport,
            deleteReportFailure,
            selectedReports,
            selectedReportsAsArray
        } = this.props;
        const columns = getColumns({
            columnsNames,
            sortHeader,
            onSort: this.onSort,
            onReportView: this.onReportView,
            onRawView: this.onRawView,
            onStop: this.onStop,
            onRunTest: this.onRunTest,
            onEditNote: this.onEditNote,
            onReportSelected: this.onReportSelected,
            selectedReports: selectedReports
        });
        const feedbackMessage = this.generateFeedbackMessage();
        const error = errorOnGetReports || errorOnGetReport || errorOnStopRunningJob || errorCreateBenchmark || errorEditReport || deleteReportFailure;

        return (
            <Page title={'Last Reports'} description={DESCRIPTION}>
                <div style={{width: '100%'}}>
                    {showReport && <Report onClose={this.closeReport} key={showReport.report_id} report={showReport}/>}
                    <div>
                        <Button
                            disabled={!this.props.isAtLeastOneReportSelected}
                            style={{
                                marginBottom: '10px',
                            }} onClick={() => {
                            this.setState({
                                showCompareReports: true
                            });
                        }}>Compare Reports</Button>
                        <Button
                            disabled={!this.props.isAtLeastOneReportSelected}
                            style={{
                                marginLeft: '10px',
                            }} onClick={() => this.setState({showDeleteReportWarning: true})}>Delete Reports</Button>

                    </div>
                    <ReactTableComponent
                        // tableRowId={'report_id'}
                        onSearch={this.onSearch}
                        rowHeight={'46px'}
                        manual={false}
                        data={sortedReports}
                        pageSize={10}
                        columns={columns}
                        noDataText={this.loader()}
                        showPagination
                        resizable={false}
                        cursor={'default'}
                        className={style.table}
                    />
                </div>
                {this.state.openViewReport
                    ? <Dialog title_key={'id'} data={this.state.openViewReport}
                              closeDialog={this.closeViewReportDialog}/> : null}

                {
                    this.state.showDeleteReportWarning && <DeleteDialog
                        display={this.props.selectedReportsAsArray.length === 1 ? 'report' : this.props.selectedReportsAsArray.length + ' selected reports'}
                        onSubmit={this.onDeleteSelectedReports}
                        onCancel={() => {
                            this.setState({showDeleteReportWarning: false})
                        }}/>
                }
                {
                    showCompareReports &&
                    <CompareReports onClose={this.closeCompareReports} selectedReportsAsArray={selectedReportsAsArray}/>
                }
                {feedbackMessage && <Snackbar
                    open={!!feedbackMessage}
                    bodyStyle={{backgroundColor: '#2fbb67'}}
                    message={feedbackMessage}
                    autoHideDuration={4000}
                    onRequestClose={() => {
                        this.props.getLastReports();
                        this.props.clearStopJobSuccess();
                        this.props.createJobSuccess(undefined);
                        this.props.editNotesSuccess(false);
                        this.props.setDeleteReportSuccess(false);
                        this.setState({
                            rerunJob: null
                        });
                    }}
                />}
                {error && <ErrorDialog closeDialog={this.onCloseErrorDialog} showMessage={error}/>}

            </Page>
        )
    }

    generateFeedbackMessage = () => {
        if (this.props.stopRunningJobSuccess) {
            return 'Job successfully aborted'
        }
        if (this.props.jobSuccess && this.state.rerunJob) {
            return `Job created successfully: ${this.props.jobSuccess.id}`;
        }
        if (this.props.noteSuccess) {
            return `report notes edited successfully`;
        }
        if (this.props.deleteReportSuccess) {
            return `selected reports are deleted successfully`;
        }


    }


}

function mapStateToProps(state) {
    return {
        reports: selectors.reports(state),
        report: selectors.report(state),
        processingGetReports: selectors.processingGetReports(state),
        errorOnGetReports: selectors.errorOnGetReports(state),
        errorOnGetReport: selectors.errorOnGetReport(state),
        errorOnStopRunningJob: errorOnStopRunningJob(state),
        stopRunningJobSuccess: stopRunningJobSuccess(state),
        jobSuccess: createJobSuccess(state),
        noteSuccess: selectors.editNotesSuccess(state),
        errorEditReport: selectors.editReportFailure(state),
        errorCreateBenchmark: selectors.createBenchmarkFailure(state),
        selectedReports: selectors.selectedReports(state),
        selectedReportsAsArray: selectors.selectedReportsAsArray(state),
        isAtLeastOneReportSelected: selectors.isAtLeastOneReportSelected(state),
        deleteReportSuccess: selectors.deleteReportSuccess(state),
        deleteReportFailure: selectors.deleteReportFailure(state)
    }
}

const mapDispatchToProps = {
    clearSelectedReport: Actions.clearSelectedReport,
    getLastReports: Actions.getLastReports,
    getReport: Actions.getReport,
    stopRunningJob: Actions.stopRunningJob,
    clearStopJobSuccess: Actions.clearStopJobSuccess,
    createJob: Actions.createJob,
    createJobSuccess: Actions.createJobSuccess,
    editReport: Actions.editReport,
    editNotesSuccess: Actions.editReportSuccess,
    cleanAllReportsErrors: Actions.cleanAllReportsErrors,
    clearErrorOnStopJob: Actions.clearErrorOnStopJob,
    addReportForCompare: Actions.addReportForCompare,
    clearSelectedReports: Actions.clearSelectedReports,
    deleteReports: Actions.deleteReports,
    setDeleteReportSuccess: Actions.deleteReportSuccess,
};

export default connect(mapStateToProps, mapDispatchToProps)(getReports);
