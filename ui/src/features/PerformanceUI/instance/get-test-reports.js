import React from 'react';
import {connect} from 'react-redux';
import {
    reports,
    report,
    processingGetReports,
    errorOnGetReports,
    errorOnGetReport
} from './redux/selectors/reportsSelector';
import {test} from './redux/selectors/testsSelector';
import {BootstrapTable, TableHeaderColumn, SearchField} from 'react-bootstrap-table';
import RaisedButton from 'material-ui/RaisedButton';
import 'react-bootstrap-table/dist/react-bootstrap-table-all.min.css';
import style from './style.scss';
import Moment from 'moment';
import Dialog from '../components/Dialog';
import * as Actions from './redux/action';
import Loader from '../components/Loader';
import Page from '../../../components/Page';
import prettySeconds from 'pretty-seconds';
import _ from 'lodash';
import TooltipWrapper from '../../../components/TooltipWrapper';
import {v4 as uuid} from 'uuid'
import Report from "../components/Report";
import env from "../../../App/common/env";

const timePattern = 'DD-MM-YYYY hh:mm:ss a';
const noDataMsg = 'There is no data to display.';
const errorMsgGetReports = 'Error occurred while trying to get all reports for test.';

class getTests extends React.Component {
    constructor(props) {
        super(props);
        const {match: {params}} = props;
        this.testId = params.testId;
        this.instance = params.instance;

        this.state = {
            openSnakeBar: false,
            openViewReport: false,
            showReport: null
        };
    }

    viewFormatter = (cell, row) => {
        return (
            <i onClick={() => {
                this.setState({openViewReport: true});
                this.props.getReport(this.testId, row.report_id);
            }} className='material-icons' style={{color: '#2a3f53'}}>visibility</i>
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

    dateFormatter = (cell, row) => {
        if (!cell) {
            return 'Still running...';
        } else {
            return (
                new Moment(cell).local().format(timePattern)
            );
        }
    };

    durationFormatter(cell, row) {
        return prettySeconds(Number(cell));
    }

        successRateFormatter(cell, row) {
            return Math.floor(row.last_success_rate) + '%';
        }

        rpsFormatter(cell, row) {
            return Math.floor(row.last_rps);
        }


    sortDates = (a, b, order) => {
        let dateA = new Date(a.end_time);
        let dateB = new Date(b.end_time);
        if (order === 'desc') {
            return dateB.getTime() - dateA.getTime();
        } else {
            return dateA.getTime() - dateB.getTime();
        }
    };
    logsFormatter = (cell, row) => {
        const link = `${env.PREDATOR_URL}/jobs/${row.job_id}/runs/${row.report_id}/logs`
        return (
            <a target='_blank' href={link}>
                <i  className='material-icons' style={{color: '#2a3f53'}}>cloud_download</i>
            </a>
        );
    };

    componentDidMount() {
        this.props.clearErrorOnGetReports();
        this.props.getReports(this.testId);
    }

    componentWillUnmount() {
        this.props.clearErrorOnGetReports();
        this.props.clearSelectedReport();
        this.props.clearSelectedTest();
    }

    loader() {
        return this.props.processingGetReports ? <Loader/> : noDataMsg
    }

    hrefFormatter(cell, row) {
        return (
            <a target='_blank' href={cell}>
                <RaisedButton primary className={style.button} label='View'/>
            </a>
        )
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

    closeReport = () => {
        this.setState({showReport: null})
    }
    openReport = (cell, row) => {
        return (<RaisedButton onClick={() => {
            this.setState({showReport: row})
        }} backgroundColor={''} primary className={style.button} label='View'/>)
    }

    render() {
        let options = {
            clearSearch: true,
            paginationPanel: this.renderPaginationPanel,
            noDataText: this.props.errorOnGetReports ? errorMsgGetReports : this.loader(),
            searchField: this.createCustomSearchField,
            defaultSortName: 'end_time',
            defaultSortOrder: 'desc'
        };
        const {showReport} = this.state;
        return (
            <Page
                title={this.props.reports && this.props.reports.length > 0 ? `${this.props.reports[0].test_name} Reports` : this.loader()}>
                {showReport &&
                <Report onClose={this.closeReport} key={showReport.report_id + 'reports'} report={showReport}/>}
                <div className={style.getTests}>
                    {this.props.reports
                        ? <div className={style.tableDiv}>
                            <BootstrapTable options={options} bodyContainerClass={style.container}
                                            tableStyle={{height: 'auto !important'}} trClassName={style.row} pagination
                                            search
                                            data={this.props.reports}
                                            striped hover>
                                <TableHeaderColumn dataField='report_id' hidden isKey dataAlign='left' width={'75'}>Report
                                    ID</TableHeaderColumn>
                                <TableHeaderColumn dataField='start_time' dataAlign='left' width={'60'}
                                                   dataFormat={this.dateFormatter} dataSort sortFunc={this.sortDates}>Start
                                    Time</TableHeaderColumn>
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
                                <TableHeaderColumn dataAlign='left' dataFormat={this.successRateFormatter} width={'40'}>Success Rate</TableHeaderColumn>
                                <TableHeaderColumn dataAlign='left' dataFormat={this.rpsFormatter} width={'40'}>RPS</TableHeaderColumn>
                                <TableHeaderColumn dataField='parallelism' dataAlign='left'
                                                   width={'35'}>Parallelism</TableHeaderColumn>
                                <TableHeaderColumn dataField='notes' dataFormat={this.notes} dataAlign='center'
                                                   width={'80'}>Notes</TableHeaderColumn>
                                <TableHeaderColumn dataField='aggregate_report' dataAlign='left'
                                                   dataFormat={this.openReport} width={'40'}>Report</TableHeaderColumn>
                                <TableHeaderColumn dataField='grafana_report' dataAlign='left'
                                                   dataFormat={this.hrefFormatter}
                                                   width={'40'}>Grafana</TableHeaderColumn>
                                <TableHeaderColumn dataField='view' dataAlign='center' dataFormat={this.viewFormatter}
                                                   width={'25'}>Raw</TableHeaderColumn>
                                <TableHeaderColumn dataAlign='center' dataFormat={this.logsFormatter}
                                                   width={'25'}>Logs</TableHeaderColumn>
                            </BootstrapTable>
                        </div> : this.loader()}

                    {this.state.openViewReport
                        ? <Dialog title_key={'report_id'} data={this.props.report}
                                  closeDialog={this.closeViewReportDialog}/> : null}

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
        errorOnGetReport: errorOnGetReport(state)
    }
}

const mapDispatchToProps = {
    clearSelectedReport: Actions.clearSelectedReport,
    clearSelectedTest: Actions.clearSelectedTest,
    clearErrorOnGetReports: Actions.clearErrorOnGetReports,
    getReports: Actions.getReports,
    getReport: Actions.getReport
};

export default connect(mapStateToProps, mapDispatchToProps)(getTests);

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
