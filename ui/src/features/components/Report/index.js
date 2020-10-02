import React from 'react';

import {prettySeconds} from '../../utils';
import PieChart from '../PieChart'
import * as Actions from "../../redux/actions/reportsActions";
import * as selectors from "../../redux/selectors/reportsSelector";
import {connect} from "react-redux";
import Box from '../Box';
import dateFormat from 'dateformat';
import Button from '../../../components/Button';
import Snackbar from "material-ui/Snackbar";
import {BarChartPredator, LineChartPredator, AssertionsReport} from "./Charts";
import _ from "lodash";
import Checkbox from "../../../components/Checkbox/Checkbox";
import Card from "../../../components/Card";
import {faStar as emptyStar} from "@fortawesome/free-regular-svg-icons";
import {faStar as fullStar} from "@fortawesome/free-solid-svg-icons";
import InfoToolTip from "../InfoToolTip";
const axios = require('axios');
var download = require("downloadjs");

const REFRESH_DATA_INTERVAL = 30000;


class Report extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            disabledCreateBenchmark: false,
            isFavorite: props.report.is_favorite,
            filteredKeys: {
                latency: {benchmark_p99: true, benchmark_p95: true, benchmark_median: true},
                rps: {
                    benchmark_mean: true
                },
                status_codes_errors: {
                    benchmark_count: true
                }
            },
            enableBenchmark: false
        }
    }

    createBenchmark = () => {
        const {aggregateReport, report} = this.props;
        this.props.createBenchmark(report.test_id, aggregateReport.benchMark);
        this.setState({disabledCreateBenchmark: true})
    };

    exportCSV = () => {
        const {report} = this.props;
        axios.get(`${process.env.PREDATOR_URL}/tests/${report.test_id}/reports/${report.report_id}/export/csv`)
        .then(response => {
            let filename = report.test_name+"_"+report.report_id+"_"+report.start_time+".csv";
            download(response.data,filename,"text/csv");
        })
        .catch(error => {
            console.log(error);
        });
    };

    onStar = () => {
        const {report, editReport} = this.props;
        const newValue = !report.is_favorite;
        const body = {
            is_favorite: newValue
        };
        editReport(report.test_id, report.report_id, body);
        this.setState({isFavorite: newValue});
    };

    onSelectedGraphPropertyFilter = (graphType, keys, value) => {
        const {filteredKeys = {}} = this.state;
        let newFilteredKeys = {...filteredKeys};
        if (_.isArray(keys)) {
            newFilteredKeys = keys.reduce((acc, cur) => {
                _.set(acc, `${graphType}.${cur}`, !value);
                return acc;
            }, filteredKeys)
        } else {
            _.set(newFilteredKeys, `${graphType}.${keys}`, !value);
        }
        this.setState({filteredKeys: {...newFilteredKeys}});
    };

    render() {
        const {report, aggregateReport} = this.props;
        const {disabledCreateBenchmark, filteredKeys, enableBenchmark, isFavorite} = this.state;
        return (
            <div>
                <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <h1 style={{minWidth: '310px'}}>{report.test_name}</h1>
                    <SummeryTable report={report}/>
                </div>
                <span>Started at {dateFormat(new Date(report.start_time), "dddd, mmmm dS, yyyy, h:MM:ss TT")}</span>
                {
                    aggregateReport.isBenchmarkExist && <div style={{
                        display: 'flex',
                        alignItems: 'center'
                    }}>
                        <div style={{color: 'rgb(87, 125, 254)', marginRight: '5px'}}>Enable benchmark</div>
                        <Checkbox
                            indeterminate={false}
                            checked={enableBenchmark}
                            // disabled={}
                            onChange={(value) => {
                                this.onSelectedGraphPropertyFilter('latency', ['benchmark_p99', 'benchmark_p95', 'benchmark_median'], value);
                                this.onSelectedGraphPropertyFilter('rps', ['benchmark_mean'], value);
                                this.onSelectedGraphPropertyFilter('status_codes_errors', ['benchmark_count'], value);
                                this.setState({enableBenchmark: value});
                            }}
                        />

                    </div>
                }
                <div style={{display: 'flex', flexDirection: 'column'}}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: '5px',
                        marginBottom: '15px'
                    }}>
                        <div onClick={this.onStar}>
                            <InfoToolTip data={{
                                key: 'star-info',
                                info: isFavorite ? 'Remove from favorites' : 'Add to favorites'
                            }} icon={isFavorite ? fullStar : emptyStar} iconSize={'25px'}/>
                        </div>
                        <Button hover disabled={report.status !== 'finished'}
                                onClick={this.exportCSV}>Export to CSV</Button>
                        <Button hover disabled={disabledCreateBenchmark || report.status !== 'finished'}
                                onClick={this.createBenchmark}>Set as Benchmark</Button>
                    </div>
                    <Card style={{display: 'flex', flexDirection: 'column', marginBottom: '15px'}}>
                        <h3>Overall Latency</h3>
                        <LineChartPredator data={aggregateReport.latencyGraph} keys={aggregateReport.latencyGraphKeys}
                                           labelY={'ms'} graphType={'latency'}
                                           onSelectedGraphPropertyFilter={this.onSelectedGraphPropertyFilter}
                                           filteredKeys={filteredKeys}/>
                    </Card>
                    <Card style={{display: 'flex', flexDirection: 'column', marginBottom: '15px'}}>
                        <h3>Status Codes</h3>
                        <LineChartPredator data={aggregateReport.errorsCodeGraph}
                                           keys={aggregateReport.errorsCodeGraphKeys}
                                           graphType={'status_codes'}
                                           connectNulls={false}
                                           onSelectedGraphPropertyFilter={this.onSelectedGraphPropertyFilter}
                                           filteredKeys={filteredKeys}/>
                    </Card>

                    <Card style={{display: 'flex', flexDirection: 'column', marginBottom: '15px'}}>
                        <h3>RPS</h3>
                        <LineChartPredator data={aggregateReport.rps} keys={aggregateReport.rpsKeys} labelY={'rps'}
                                           graphType={'rps'}
                                           onSelectedGraphPropertyFilter={this.onSelectedGraphPropertyFilter}
                                           filteredKeys={filteredKeys}/>
                    </Card>
                    <Card style={{
                        display: 'flex',
                        marginBottom: '15px',
                        justifyContent: 'space-evenly',
                        height: '470px'
                    }}>
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            height: '100%',
                            marginRight: '10px',
                            flex: 1
                        }}>
                            <h3>Status Codes And Errors Distribution</h3>
                            <BarChartPredator data={aggregateReport.errorsBar} keys={aggregateReport.errorsBarKeys}
                                              graphType={'status_codes_errors'}
                                              onSelectedGraphPropertyFilter={this.onSelectedGraphPropertyFilter}
                                              filteredKeys={filteredKeys}/>
                        </div>
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            height: '100%'
                        }}>
                            <h3>Scenarios</h3>
                            <PieChart data={aggregateReport.scenarios}/>
                        </div>
                    </Card>
                    {
                        (aggregateReport.assertionsTable && aggregateReport.assertionsTable.rows.length) > 0 &&
                        <Card style={{display: 'flex', flexDirection: 'column', marginBottom: '15px'}}>
                            <h3>Assertions</h3>
                            <AssertionsReport data={aggregateReport.assertionsTable}/>
                        </Card>
                    }

                </div>
                <Snackbar
                    open={this.props.createBenchmarkSucceed}
                    bodyStyle={{backgroundColor: '#2fbb67'}}
                    message={'create benchmark succeeded'}
                    autoHideDuration={4000}
                    onRequestClose={() => {
                        this.props.createBenchmarkSuccess(false);
                    }}
                />
            </div>
        );
    }

    loadData = () => {
        const {getAggregateReports, getBenchmark, report} = this.props;
        getAggregateReports([{testId: report.test_id, reportId: report.report_id}]);
        getBenchmark(report.test_id);
    };

    componentDidMount() {
        this.loadData();
        this.refreshDataInterval = setInterval(this.loadData, REFRESH_DATA_INTERVAL)
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps.editReportSuccess === false && this.props.editReportSuccess === true) {
            this.props.setEditReportSuccess(false);
            this.props.getReport(this.props.report.test_id, this.props.report.report_id);
        }

    }

    componentWillUnmount() {
        clearInterval(this.refreshDataInterval);
        this.props.clearAggregateReportAndBenchmark();
    }

};


function mapStateToProps(state) {
    return {
        aggregateReport: selectors.getAggregateReport(state),
        createBenchmarkSucceed: selectors.createBenchmarkSuccess(state),
        editReportSuccess: selectors.editReportSuccess(state),
    }
}

const mapDispatchToProps = {
    getAggregateReports: Actions.getAggregateReports,
    createBenchmark: Actions.createBenchmark,
    createBenchmarkSuccess: Actions.createBenchmarkSuccess,
    getBenchmark: Actions.getBenchmark,
    clearAggregateReportAndBenchmark: Actions.clearAggregateReportAndBenchmark,
    editReport: Actions.editReport,
    getReport: Actions.getReport,
    setEditReportSuccess: Actions.editReportSuccess,
};


const SummeryTable = ({report = {}}) => {
    return (
        <div style={{display: 'flex', flexDirection: 'row', flexWrap: 'wrap'}}>
            <Box title={'Test status'} value={report.status}/>
            <Box title={'Duration'} value={prettySeconds(Number(report.duration))}/>
            <Box title={'Parallelism'} value={report.parallelism}/>
            {report.score && <Box title={'Score'} value={Math.floor(report.score)}/>}
        </div>
    );
}

export default connect(mapStateToProps, mapDispatchToProps)(Report);
