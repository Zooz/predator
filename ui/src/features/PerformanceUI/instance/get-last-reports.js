import React from 'react';
import {connect} from 'react-redux';
import prettySeconds from 'pretty-seconds';
import {
    reports,
    report,
    processingGetReports,
    errorOnGetReport,
    errorOnGetReports
} from './redux/selectors/reportsSelector';
import {errorOnStopRunningJob, stopRunningJobSuccess} from './redux/selectors/jobsSelector';
import {tests} from './redux/selectors/testsSelector';
import Snackbar from 'material-ui/Snackbar';
import {BootstrapTable, TableHeaderColumn, SearchField} from 'react-bootstrap-table';
import RaisedButton from 'material-ui/RaisedButton';
import 'react-bootstrap-table/dist/react-bootstrap-table-all.min.css';
import style from './style.scss';
import Moment from 'moment';
import Dialog from '../components/Dialog';
import * as Actions from './redux/action';
import Loader from '../components/Loader';
import Page from '../../../components/Page';
import classNames from 'classnames';
import _ from 'lodash';
import TooltipWrapper from '../../../components/TooltipWrapper';
import {v4 as uuid} from 'uuid'
import Report from '../components/Report';
import env from "../../../App/common/env";

const timePattern = 'DD-MM-YYYY hh:mm:ss a';
const noDataMsg = 'There is no data to display.';
const errorMsgGetTests = 'Error occurred while trying to get all reports.';
const REFRESH_DATA_INTERVAL = 30000;

class getReports extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            showReport: false
        };
    }

    viewFormatter = (cell, row) => {
        return (
            <i onClick={() => {
                this.setState({openViewReport: true});
                this.props.getReport(row.test_id, row.report_id);
            }} className='material-icons' style={{color: '#2a3f53'}}>visibility</i>
        );
    };

    logsFormatter = (cell, row) => {
        const link = `${env.PREDATOR_URL}/jobs/${row.job_id}/runs/${row.report_id}/logs`
        return (
            <a target='_blank' href={link}>
            <i  className='material-icons' style={{color: '#2a3f53'}}>cloud_download</i>
            </a>
        );
    };

    notes = (cell, row) => {
        if (cell) {
            const id = uuid();
            cell = cell.split('\n').map((row) => (<p>{row}</p>));
            return <TooltipWrapper
                content={<div>
                    {cell}
                </div>}
                dataId={`tooltipKey_${id}`}
                place='top'
                offset={{top: 1}}
            >
                <div className={style.notes} data-tip data-for={`tooltipKey_${id}`} style={{cursor: 'pointer'}}>
                    {cell}
                </div>

            </TooltipWrapper>;
        }
    };
    dateFormatter = (cell, row) => {
        if (!cell) {
            return 'Still running...';
        } else {
            return (
                new Moment(cell).local().format(timePattern)
            );
        }
    };

    createCustomSearchField = (props) => {
        return (
            <SearchField style={{width: '40%', float: 'right'}}
                         defaultValue={props.defaultSearch}
                         placeholder={props.searchPlaceholder}/>
        );
    };

    closeViewReportDialog = () => {
        this.setState({
            openViewReport: false
        });
        this.props.clearSelectedReport();
    };

    renderPaginationPanel = (props) => {
        return (
            <div className={style.pagination}>
                <div>{props.components.pageList}</div>
                <div>
                    {props.components.sizePerPageDropdown}
                </div>
            </div>
        );
    };

    hrefFormatter(cell, row) {
        return (
            <a target='_blank' href={cell}>
                <RaisedButton backgroundColor={''} primary className={style.button} label='View'/>
            </a>
        )
    }

    openReport = (cell, row) => {
        return (<RaisedButton onClick={() => {
            this.setState({showReport: row})
        }} backgroundColor={''} primary className={style.button} label='View'/>)
    }

    statusFormatter(cell, row) {
        let mapper = {
            'in_progress': 'Running',
            'aborted': 'Aborted',
            'finished': 'Finished',
            'started': 'Started',
            'partially_finished': 'Partially Finished',
            'failed': 'Failed'
        };
        return (mapper[cell] ? mapper[cell] : cell);
    }

    durationFormatter(cell, row) {
        return prettySeconds(Number(cell));
    }

    successRateFormatter(cell, row) {
        return Math.floor(row.last_success_rate) + '%';
    }

    rpsFormatter(cell, row) {
            return Math.floor(row.last_rps);
    }

        stopTestFormatter(cell, row, that) {
        const handleStopTest = () => {
            that.props.stopRunningJob(row.job_id, row.report_id);
        };

        const disabled = (row.status !== 'in_progress' && row.status !== 'started');
        const classes = classNames('material-icons', style.deleteIcon, {
            [style.deleteIconDisabled]: disabled
        });

        return (
            <i onClick={() => {
                if (disabled) {

                } else {
                    handleStopTest()
                }
            }} className={classes}>pan_tool</i>
        );
    }

    testNameFormatter = (cell, row) => {
        let test = this.props.tests.find((element) => {
            return element.id === row.test_id;
        });
        let testName = test && test.name ? test.name : 'N/A';
        return testName;
    };

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

    loader() {
        return this.props.processingGetReports ? <Loader/> : noDataMsg
    }

    render() {
        let options = {
            clearSearch: true,
            paginationPanel: this.renderPaginationPanel,
            noDataText: this.props.errorOnGetTests ? errorMsgGetTests : this.loader(),
            searchField: this.createCustomSearchField
        };
        const {showReport} = this.state;
        return (
            <Page title={'Last Reports'}>
                {showReport && <Report onClose={this.closeReport} key={showReport.report_id} report={showReport}/>}
                <div className={style.getTests}>
                    <div className={style.tableDiv}>
                        <BootstrapTable options={options} bodyContainerClass={style.container}
                                        tableStyle={{height: 'auto !important'}} trClassName={style.row} pagination
                                        search
                                        data={this.props.reports}
                                        striped hover>
                            <TableHeaderColumn dataField='report_id' hidden isKey dataAlign='left'
                                               width={'75'}>Report ID</TableHeaderColumn>
                            <TableHeaderColumn dataFormat={this.testNameFormatter} width={'50'}
                                               tdStyle={{whiteSpace: 'normal'}} thStyle={{whiteSpace: 'normal'}}>Test
                                Name</TableHeaderColumn>
                            <TableHeaderColumn dataField='start_time' dataAlign='left' width={'60'}
                                               dataFormat={this.dateFormatter} dataSort
                                               sortFunc={this.sortDates}>Start Time</TableHeaderColumn>
                            <TableHeaderColumn dataField='end_time' dataAlign='left' width={'60'}
                                               dataFormat={this.dateFormatter}>End Time</TableHeaderColumn>
                            <TableHeaderColumn dataField='duration' dataAlign='left' width={'30'}
                                               dataFormat={this.durationFormatter} tdStyle={{whiteSpace: 'normal'}}
                                               thStyle={{whiteSpace: 'normal'}}>Duration</TableHeaderColumn>
                            <TableHeaderColumn dataField='status' dataAlign='left' width={'25'}
                                               dataFormat={this.statusFormatter}>Status</TableHeaderColumn>
                            <TableHeaderColumn dataField='arrival_rate' dataAlign='left' width={'35'}>Arrival
                                Rate</TableHeaderColumn>
                            <TableHeaderColumn dataField='ramp_to' dataAlign='left'
                                               width={'25'}>Ramp</TableHeaderColumn>
                            <TableHeaderColumn dataAlign='left' dataFormat={this.successRateFormatter} width={'40'}>Success
                                Rate</TableHeaderColumn>
                                <TableHeaderColumn dataAlign='left' dataFormat={this.rpsFormatter} width={'40'}>RPS</TableHeaderColumn>
                            <TableHeaderColumn dataField='parallelism' dataAlign='left'
                                               width={'35'}>Parallelism</TableHeaderColumn>
                            <TableHeaderColumn dataField='notes' dataFormat={this.notes} dataAlign='left'
                                               width={'80'}>Notes</TableHeaderColumn>
                            <TableHeaderColumn dataField='aggregate_report' dataAlign='left'
                                               dataFormat={this.openReport}
                                               width={'40'}>Report</TableHeaderColumn>
                            <TableHeaderColumn dataField='grafana_report' dataAlign='left'
                                               dataFormat={this.hrefFormatter} width={'40'}>Grafana</TableHeaderColumn>
                            <TableHeaderColumn dataField='view' dataAlign='center' dataFormat={this.viewFormatter}
                                               width={'25'}>Raw</TableHeaderColumn>
                           <TableHeaderColumn dataAlign='center' dataFormat={this.logsFormatter}
                                              width={'25'}>Logs</TableHeaderColumn>

                            <TableHeaderColumn dataAlign='center' dataFormat={this.stopTestFormatter}
                                               formatExtraData={this} width={'25'}>Stop</TableHeaderColumn>
                        </BootstrapTable>
                    </div>

                    {this.state.openViewReport
                        ? <Dialog title_key={'id'} data={this.props.report}
                                  closeDialog={this.closeViewReportDialog}/> : null}

                    <Snackbar
                        anchorOrigin={{
                            vertical: 'top',
                            horizontal: 'center'
                        }}
                        open={(this.props.stopRunningJobSuccess)}
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
                </div>
            </Page>
        )
    }
}

function mapStateToProps(state) {
    return {
        reports: reports(state),
        report: report(state),
        processingGetReports: processingGetReports(state),
        errorOnGetReports: errorOnGetReports(state),
        errorOnGetReport: errorOnGetReport(state),
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

let getData = (cell, row, field) => {
    try {
        let innerFields = field.split('.');
        let data = cell[innerFields[0]];
        for (let i = 1; i < innerFields.length; i++) {
            data = data[innerFields[i]];
        }
        return data;
    } catch (err) {
        return 'N/A';
    }
};
