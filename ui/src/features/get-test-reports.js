import React from 'react';
import {connect} from 'react-redux';
import * as selectors from './redux/selectors/reportsSelector';
import style from './style.scss';
import Dialog from './components/Dialog';
import * as Actions from './redux/action';
import Loader from './components/Loader';
import Page from '../components/Page';
import _ from 'lodash';
import Report from "./components/Report";
import CompareReports from "./components/Report/compareReports";
import {ReactTableComponent} from "../components/ReactTable";
import {getColumns} from "./configurationColumn";
import {createJobRequest} from "./requestBuilder";
import {createJobSuccess} from "./redux/selectors/jobsSelector";
import Snackbar from 'material-ui/Snackbar';
import ErrorDialog from "./components/ErrorDialog";
import Button from "../components/Button";
import DeleteDialog from "./components/DeleteDialog";

const noDataMsg = 'There is no data to display.';
const errorMsgGetReports = 'Error occurred while trying to get all reports for test.';
const columnsNames = ['compare', 'start_time', 'end_time', 'duration', 'status', 'arrival_rate',
    'ramp_to', 'last_success_rate', 'avg_rps', 'parallelism', 'notes', 'grafana_report', 'report', 'score', 'rerun', 'raw', 'logs'];

const DESCRIPTION = 'All reports for a given test.';

class getTests extends React.Component {
    constructor(props) {
        super(props);
        const {match: {params}} = props;
        this.testId = params.testId;
        this.instance = params.instance;
        this.state = {
            openSnakeBar: false,
            openViewReport: false,
            showReport: null,
            sortedReports: [],
            sortHeader: '',
            rerunJob: null,
            showCompareReports: false
        };
    }

    onRunTest = (job) => {
        const request = createJobRequest(job);
        delete request.cron_expression;
        request.run_immediately = true;
        this.props.createJob(request);
        this.setState({rerunJob: job});
    };

    componentDidUpdate(prevProps) {
        if (prevProps.reports !== this.props.reports) {
            this.setState({sortedReports: [...this.props.reports]})
        }
        if (prevProps.deleteReportSuccess === false && this.props.deleteReportSuccess) {
            this.props.getReports(this.testId);
        }
    }

    onEditNote = (testId, reportId, notes) => {
        const {editReport} = this.props;
        editReport(testId, reportId, {notes});
    };
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
            return (String(report.status).toLowerCase().includes(value.toLowerCase()))
        });
        this.setState({sortedReports: newSorted})
    };

    onCloseErrorDialog = () => {
        this.props.cleanAllReportsErrors();
    };

    onReportView = (data) => {
        this.setState({showReport: data})
    };
    onRawView = (data) => {
        this.setState({openViewReport: data});
    };


    closeViewReportDialog = () => {
        this.setState({
            openViewReport: false
        });
        this.props.clearSelectedReport();
    };

    componentDidMount() {
        this.props.clearErrorOnGetReports();
        this.props.getReports(this.testId);
    }

    componentWillUnmount() {
        this.props.clearErrorOnGetReports();
        this.props.clearSelectedReport();
        this.props.clearSelectedTest();
        this.props.clearSelectedReports();
    }

    loader() {
        return this.props.processingGetReports ? <Loader/> : noDataMsg
    }

    closeReport = () => {
        this.setState({showReport: null})
    };
    closeCompareReports = () => {
        this.setState({showCompareReports: false})
    };
    onReportSelected = (testId, reportId, value) => {
        this.props.addReportForCompare(testId, reportId, value);
    };

    onDeleteSelectedReports = () => {
        this.setState({showDeleteReportWarning: false})
        this.props.deleteReports(this.props.selectedReportsAsArray)
    };

    render() {
        const noDataText = this.props.errorOnGetReports ? errorMsgGetReports : this.loader();
        const {sortHeader, sortedReports} = this.state;
        const {
            errorCreateBenchmark,
            errorEditReport,
            selectedReports,
            selectedReportsAsArray,
            deleteReportFailure,
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
            selectedReports: selectedReports,
        });
        const {showReport, showCompareReports} = this.state;

        const feedbackMessage = this.generateFeedbackMessage();
        const error = errorCreateBenchmark || errorEditReport || deleteReportFailure;
        return (
            <Page
                title={this.props.reports && this.props.reports.length > 0 && `${this.props.reports[0].test_name} Reports`}
                description={DESCRIPTION}>
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
                    onSearch={this.onSearch}
                    rowHeight={'46px'}
                    manual={false}
                    data={sortedReports}
                    pageSize={10}
                    columns={columns}
                    noDataText={noDataText}
                    showPagination
                    resizable={false}
                    cursor={'default'}
                    // className={style.table}
                />
                {showReport &&
                <Report onClose={this.closeReport} key={showReport.report_id + 'reports'} report={showReport}/>}
                {this.state.openViewReport ? <Dialog title_key={'report_id'} data={this.state.openViewReport}
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
                {this.state.openViewReport ? <Dialog title_key={'report_id'} data={this.state.openViewReport}
                                                     closeDialog={this.closeViewReportDialog}/> : null}
                {feedbackMessage && <Snackbar
                    open={!!feedbackMessage}
                    bodyStyle={{backgroundColor: '#2fbb67'}}
                    message={this.generateFeedbackMessage()}
                    autoHideDuration={4000}
                    onRequestClose={() => {
                        this.props.createJobSuccess(undefined);
                        this.setState({
                            rerunJob: null
                        });
                        this.props.setDeleteReportSuccess(false);
                        this.props.editNotesSuccess(false);
                    }}
                />}
                {error && <ErrorDialog closeDialog={this.onCloseErrorDialog} showMessage={error}/>}

            </Page>
        )
    }

    generateFeedbackMessage = () => {

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
    clearSelectedTest: Actions.clearSelectedTest,
    clearErrorOnGetReports: Actions.clearErrorOnGetReports,
    getReports: Actions.getReports,
    getReport: Actions.getReport,
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

export default connect(mapStateToProps, mapDispatchToProps)(getTests);
