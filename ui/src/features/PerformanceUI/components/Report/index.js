import React from 'react';

import Modal from '../Modal';
import {prettySeconds} from '../../instance/utils';
import PieChart from '../PieChart'
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart,
    Legend,
    BarChart, Bar,
    Line
} from 'recharts';

import * as Actions from "../../instance/redux/actions/reportsActions";
import * as selectors from "../../instance/redux/selectors/reportsSelector";
import {connect} from "react-redux";
import Box from '../Box';
import dateFormat from 'dateformat';
import Button from '../Button';

const REFRESH_DATA_INTERVAL = 30000;
const COLORS = [{stroke: "#8884d8", fill: "#8884d8"},
    {stroke: "#82ca9d", fill: "#82ca9d"},
    {stroke: "#ffc658", fill: "#ffc658"}
];


class Report extends React.Component {

    generateAreaChart = (data, keys, labelY) => {
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
    lineChart = (data, keys) => {
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
                    <YAxis domain={[0, dataMax => Math.round(dataMax * 1.1)]}/>
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
    barChart = (data, keys) => {
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

    render() {
        const {report, onClose,aggregateReport} = this.props;
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
                    <h3>Overall Latency</h3>
                    {this.generateAreaChart(aggregateReport.latencyGraph, ['median', 'p95', 'p99'], 'ms')}
                    <h3>Status Codes</h3>
                    {this.lineChart(aggregateReport.errorsCodeGraph, Object.keys(aggregateReport.errorCodes))}
                    <h3>RPS</h3>
                    {this.generateAreaChart(aggregateReport.rps, ['mean'])}
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
                <div style={{display:'flex',flexDirection:'row',justifyContent:'flex-end'}}>
                        <Button onClick={onClose} label={'CLOSE'}/>
                </div>
            </Modal>
        );
    }
    loadData = () => {
        const {getAggregateReport, report} = this.props;
        getAggregateReport(report.test_id, report.report_id);

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
        aggregateReport: selectors.getAggregateReort(state),
    }
}

const mapDispatchToProps = {
    getAggregateReport: Actions.getAggregateReport,
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
