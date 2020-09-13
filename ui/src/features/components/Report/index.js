import React from 'react';

import Modal from '../Modal';
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

const REFRESH_DATA_INTERVAL = 30000;


class Report extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            disabledCreateBenchmark: false,
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

    onExitReport = () => {
        const {clearAggregateReportAndBenchmark, onClose} = this.props;
        clearAggregateReportAndBenchmark();
        onClose();
    };

    render() {
        const {report, aggregateReport} = this.props;
        const {disabledCreateBenchmark, filteredKeys, enableBenchmark} = this.state;
        return (
            <Modal onExit={this.onExitReport}>
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
                <div>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <h3>Overall Latency</h3>
                        <Button hover disabled={disabledCreateBenchmark || report.status !== 'finished'}
                                onClick={this.createBenchmark}>Set as Benchmark</Button>
                    </div>
                    <LineChartPredator data={aggregateReport.latencyGraph} keys={aggregateReport.latencyGraphKeys}
                                       labelY={'ms'} graphType={'latency'}
                                       onSelectedGraphPropertyFilter={this.onSelectedGraphPropertyFilter}
                                       filteredKeys={filteredKeys}/>

                    <h3>Status Codes</h3>
                    <LineChartPredator data={aggregateReport.errorsCodeGraph} keys={aggregateReport.errorsCodeGraphKeys}
                                       graphType={'status_codes'}
                                       connectNulls={false}
                                       onSelectedGraphPropertyFilter={this.onSelectedGraphPropertyFilter}
                                       filteredKeys={filteredKeys}/>
                    <h3>RPS</h3>
                    <LineChartPredator data={aggregateReport.rps} keys={aggregateReport.rpsKeys} labelY={'rps'}
                                       graphType={'rps'}
                                       onSelectedGraphPropertyFilter={this.onSelectedGraphPropertyFilter}
                                       filteredKeys={filteredKeys}/>
                    <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between'}}>
                        <div style={{width: '50%'}}>
                            <h3>Status Codes And Errors Distribution</h3>
                            <BarChartPredator data={aggregateReport.errorsBar} keys={aggregateReport.errorsBarKeys}
                                              graphType={'status_codes_errors'}
                                              onSelectedGraphPropertyFilter={this.onSelectedGraphPropertyFilter}
                                              filteredKeys={filteredKeys}/>
                        </div>
                        <div>
                            <h3>Scenarios</h3>
                            <PieChart data={aggregateReport.scenarios}/>
                        </div>
                    </div>
                    {
                        aggregateReport.assertionsTable && aggregateReport.assertionsTable.headers.length > 0 &&
                        <>
                            <h3>Assertions</h3>
                            <AssertionsReport data={aggregateReport.assertionsTable}/>
                        </>
                    }

                </div>
                <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'flex-end'}}>
                    <Button inverted onClick={this.onExitReport}>Close</Button>
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
            </Modal>
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


    componentWillUnmount() {
        clearInterval(this.refreshDataInterval);
        this.props.clearAggregateReportAndBenchmark();
    }

};


function mapStateToProps(state) {
    return {
        aggregateReport: selectors.getAggregateReport(state),
        createBenchmarkSucceed: selectors.createBenchmarkSuccess(state),
    }
}

const mapDispatchToProps = {
    getAggregateReports: Actions.getAggregateReports,
    createBenchmark: Actions.createBenchmark,
    createBenchmarkSuccess: Actions.createBenchmarkSuccess,
    getBenchmark: Actions.getBenchmark,
    clearAggregateReportAndBenchmark: Actions.clearAggregateReportAndBenchmark,
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
