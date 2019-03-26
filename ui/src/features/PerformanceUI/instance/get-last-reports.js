import React from 'react';
import {connect} from 'react-redux';
import * as selectors from './redux/selectors/reportsSelector';
import {errorOnStopRunningJob, stopRunningJobSuccess} from './redux/selectors/jobsSelector';
import {tests} from './redux/selectors/testsSelector';
import Snackbar from 'material-ui/Snackbar';
import 'react-bootstrap-table/dist/react-bootstrap-table-all.min.css';
import style from './style.scss';
import Dialog from '../components/Dialog';
import * as Actions from './redux/action';
import Page from '../../../components/Page';
import _ from 'lodash';
import Report from '../components/Report';

import {ReactTableComponent} from './../../../components/ReactTable';
import {getColumns} from './configurationColumn'

const REFRESH_DATA_INTERVAL = 30000;

//TODO add error handler - should i? maybe in the main
const columnsNames = ['test_name', 'start_time', 'end_time', 'duration', 'status', 'arrival_rate',
    'ramp_to', 'last_success_rate', 'last_rps', 'parallelism', 'notes', 'report', 'grafana_report', 'raw', 'logs', 'stop'];


class getReports extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            showReport: false,
            sortedReports: [],
            sortHeader: ''
        };
    }

    componentDidUpdate(prevProps) {
        if (prevProps.reports !== this.props.reports) {
            this.setState({sortedReports: [...this.props.reports]})
        }
    }


    onRawView = (report) => {
        this.setState({openViewReport: report});
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
        this.props.getTests();
        this.props.clearErrorOnGetReports();
        this.props.getAllReports();
    };

    componentWillUnmount() {
        this.props.clearErrorOnGetReports();
        this.props.clearSelectedReport();
        clearInterval(this.refreshDataInterval);
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
            return (report.test_name.includes(value.toLowerCase()) || report.status.includes(value.toLowerCase()))
        });
        this.setState({sortedReports: newSorted})
    };

    render() {

        const {showReport, sortHeader, sortedReports} = this.state;
        const columns = getColumns({
            columnsNames,
            sortHeader,
            onSort: this.onSort,
            onReportView: this.onReportView,
            onRawView: this.onRawView,
            onStop: this.onStop
        });

        return (
            <Page title={'Last Reports'}
                  description={'here is the last reports here is the last reports here is the last reports here is the last reports here is the last reports'}>

                <div style={{width: '100%'}}>
                    {showReport && <Report onClose={this.closeReport} key={showReport.report_id} report={showReport}/>}
                    <ReactTableComponent
                        // tableRowId={'report_id'}
                        onSearch={this.onSearch}
                        rowHeight={'46px'}
                        manual={false}
                        data={sortedReports}
                        pageSize={10}
                        // numericPagination
                        // cellPadding={text('cellPadding')}
                        columns={columns}
                        // selectedRow={text('selected row')}
                        // selectRow={selectRow}
                        // sortEvent={sortEvent}
                        // rowHeight={text('height', '')}
                        showPagination
                        resizable={false}
                        cursor={'default'}
                        className={style.table}
                    />
                </div>
                {this.state.openViewReport
                    ? <Dialog title_key={'id'} data={this.state.openViewReport}
                              closeDialog={this.closeViewReportDialog}/> : null}

                <Snackbar
                    anchorOrigin={{
                        vertical: 'top',
                        horizontal: 'center'
                    }}
                    open={(!!this.props.stopRunningJobSuccess)}
                    bodyStyle={{backgroundColor: '#2fbb67'}}
                    message={this.props.stopRunningJobSuccess ? 'Job successfully aborted' : ''}
                    autoHideDuration={4000}
                    onRequestClose={() => {
                        this.props.getAllReports();
                        this.props.clearStopJobSuccess();
                        this.props.clearStoppedJobError();
                        this.setState({
                            showSnackbar: false
                        });
                    }}
                />
            </Page>
        )
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
        tests: tests(state)
    }
}

const mapDispatchToProps = {
    clearSelectedReport: Actions.clearSelectedReport,
    clearErrorOnGetReports: Actions.clearErrorOnGetReports,
    getAllReports: Actions.getLastReports,
    getReport: Actions.getReport,
    stopRunningJob: Actions.stopRunningJob,
    clearStopJobSuccess: Actions.clearStopJobSuccess,
    clearStoppedJobError: Actions.clearErrorOnStopJob,
    getTests: Actions.getTests
};

export default connect(mapStateToProps, mapDispatchToProps)(getReports);
