import React from 'react';

import Modal from '../Modal';
import {prettySeconds} from '../../utils';
import PieChart from '../PieChart'
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart,
    Legend,
    BarChart,
    Bar,
    Line
} from 'recharts';

import * as Actions from "../../redux/actions/reportsActions";
import * as selectors from "../../redux/selectors/reportsSelector";
import {connect} from "react-redux";
import Box from '../Box';
import dateFormat from 'dateformat';
import Button from '../../../components/Button';
import Snackbar from "material-ui/Snackbar";

const REFRESH_DATA_INTERVAL = 30000;
const COLORS = [{stroke: "#8884d8", fill: "#8884d8"},
    {stroke: "#82ca9d", fill: "#82ca9d"},
    {stroke: "#ffc658", fill: "#ffc658"}
];


class Report extends React.Component {

    generateAreaChart = (data, keys=[], labelY) => {
        return (
            <ResponsiveContainer width="100%" height={300}>
                <AreaChart
                    width={700}
                    height={400}
                    data={data}
                    margin={{
                        top: 10, right: 30, left: 0, bottom: 0,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3"/>
                    <XAxis dataKey="name"/>
                    <YAxis label={labelY} domain={[0, dataMax => Math.round(dataMax * 1.1)]}/>
                    <Legend/>
                    <Tooltip/>
                    {
                        keys.map((key, index) => {
                            const color = COLORS[index % COLORS.length];
                            return (<Area key={index} type="monotone" dataKey={key}
                                          stroke={color.stroke} fill={color.fill}/>)
                        })
                    }
                </AreaChart>
            </ResponsiveContainer>
        )
    }
    lineChart = (data, keys=[], labelY) => {
        return (
            <ResponsiveContainer width="100%" height={300}>
                <LineChart
                    width={700}
                    height={400}
                    data={data}
                    margin={{
                        top: 10, right: 30, left: 0, bottom: 0,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3"/>
                    <XAxis dataKey="name"/>
                    <YAxis label={labelY} domain={[0, dataMax => Math.round(dataMax * 1.1)]}/>
                    <Legend/>
                    <Tooltip/>
                    {
                        keys.map((key, index) => {
                            const color = COLORS[index % COLORS.length];
                            return (<Line key={index} type="monotone" dataKey={key} dot={null}
                                          stroke={color.stroke}/>)
                        })
                    }
                </LineChart>
            </ResponsiveContainer>
        )
    }
    barChart = (data, keys=[]) => {
        return (
            <ResponsiveContainer width={'100%'} height={300}>
                <BarChart
                    height={300}
                    data={data}
                    margin={{
                        top: 20, right: 30, left: 20, bottom: 5,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3"/>
                    <XAxis dataKey="name"/>
                    <YAxis/>
                    <Tooltip/>
                    {
                        keys.map((key, index) => {
                            const color = COLORS[index % COLORS.length];
                            return (<Bar barSize={50} key={index} dataKey={key} fill={color.fill}/>)
                        })
                    }
                </BarChart>
            </ResponsiveContainer>
        )
    };
    createBenchmark = ()=>{
        const {aggregateReport, report} = this.props;
        this.props.createBenchmark(report.test_id, aggregateReport.benchMark);
    };

    render() {
        const {report, onClose, aggregateReport} = this.props;
        console.log("manor report",report);
        console.log("manor aggregateReport",aggregateReport);
        return (
            <Modal onExit={onClose}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <h1>{report.test_name}</h1>
                    <SummeryTable report={report}/>
                </div>
                <span>Started at {dateFormat(new Date(report.start_time), "dddd, mmmm dS, yyyy, h:MM:ss TT")}</span>
                <div>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <h3>Overall Latency</h3>
                        <Button hover disabled={report.status !== 'finished'}
                                onClick={this.createBenchmark}>Create Benchmark</Button>
                    </div>
                    {this.lineChart(aggregateReport.latencyGraph, aggregateReport.latencyGraphKeys, 'ms')}
                    <h3>Status Codes</h3>
                    {this.lineChart(aggregateReport.errorsCodeGraph, aggregateReport.errorsCodeGraphKeys)}
                    <h3>RPS</h3>
                    {this.generateAreaChart(aggregateReport.rps, aggregateReport.rpsKeys)}
                    <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between'}}>
                        <div style={{width: '50%'}}>
                            <h3>Status Codes And Errors Distribution</h3>
                            {this.barChart(aggregateReport.errorsBar, ['count'])}
                        </div>
                        <div>
                            <h3>Scenarios</h3>
                            <PieChart data={aggregateReport.scenarios}/>
                        </div>
                    </div>
                </div>
                <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'flex-end'}}>
                    <Button inverted onClick={onClose}>Close</Button>
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
        const {getAggregateReports, report} = this.props;
        getAggregateReports([{testId:report.test_id, reportId:report.report_id}]);

    }

    componentDidMount() {
        this.loadData();
        this.refreshDataInterval = setInterval(this.loadData, REFRESH_DATA_INTERVAL)
    }


    componentWillUnmount() {
        clearInterval(this.refreshDataInterval);
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
};


const SummeryTable = ({report = {}}) => {
    return (
        <div style={{display: 'flex', flexDirection: 'row'}}>
            <Box title={'Test status'} value={report.status}/>
            <Box title={'Duration'} value={prettySeconds(Number(report.duration))}/>
            <Box title={'Parallelism'} value={report.parallelism}/>
        </div>
    );
}

export default connect(mapStateToProps, mapDispatchToProps)(Report);
