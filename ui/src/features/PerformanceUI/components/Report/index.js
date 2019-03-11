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

    prepareData = (report) => {
        let latencyGraph = [];
        let errorsCodeGraph = [];
        let errorCodes = {};
        let errorsGraph = [];
        let errors = {};
        let rps = [];
        let errorsBar = [];
        let scenarios = [];
        if (report) {
            const startTime = new Date(report.start_time).getTime();
            report.intermediate.forEach((bucket, index) => {
                const latency = bucket.latency;
                const time = new Date(startTime + (bucket.bucket * 1000));
                latencyGraph.push({
                    name: `${dateFormat(time, 'h:MM:ss')}`,
                    median: latency.median,
                    p95: latency.p95,
                    p99: latency.p99,
                });
                rps.push({name: `${dateFormat(time, 'h:MM:ss')}`, mean: bucket.rps.mean});

                if (Object.keys(bucket.codes).length > 0) {
                    errorsCodeGraph.push({name: `${dateFormat(time, 'h:MM:ss')}`, ...bucket.codes, ...bucket.errors});
                    Object.keys(bucket.codes).forEach((code) => {
                        errorCodes[code] = true;
                    });
                    Object.keys(bucket.errors).forEach((error) => {
                        errorCodes[error] = true;
                    })
                }

            })

            Object.keys(report.aggregate.codes).forEach((code) => {
                errorsBar.push({name: code, count: report.aggregate.codes[code]})
            });
            Object.keys(report.aggregate.errors).forEach((error) => {
                errorsBar.push({name: error, count: report.aggregate.errors[error]})
            });
            Object.keys(report.aggregate.scenarioCounts).forEach((key) => {
                scenarios.push({name: key, value: report.aggregate.scenarioCounts[key]})
            })

        }

        return {
            latencyGraph,
            errorsCodeGraph,
            errorCodes,
            errorsGraph,
            errors,
            rps,
            errorsBar,
            scenarios
        }
    }

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
                            return (<Area key={index} type="monotone" dataKey={key} stackId={1}
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
                            return (<Line key={index} type="monotone" dataKey={key} stackId={index + 1} dot={null}
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
                            return (<Bar barSize={50} key={index} dataKey={key} stackId={index + 1} fill={color.fill}/>)
                        })
                    }
                </BarChart>
            </ResponsiveContainer>
        )
    };

    render() {
        const data = this.prepareData(this.props.aggregateReport);
        const {report, onClose} = this.props;

        return (
            <Modal>
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
                    {this.generateAreaChart(data.latencyGraph, ['median', 'p95', 'p99'], 'ms')}
                    <h3>Status Codes</h3>
                    {this.lineChart(data.errorsCodeGraph, Object.keys(data.errorCodes))}
                    <h3>RPS</h3>
                    {this.generateAreaChart(data.rps, ['mean'])}

                    <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between'}}>
                        <div style={{width: '50%'}}>
                            <h3>Status Codes And Errors Distribution</h3>
                            {this.barChart(data.errorsBar, ['count'])}
                        </div>
                        <div>
                            <h3>Scenarios</h3>
                            <PieChart data={data.scenarios}/>
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
        document.addEventListener("keydown", this.onClose, false);
    }


    componentWillUnmount() {
        clearInterval(this.refreshDataInterval);
        document.removeEventListener("keydown", this.onClose, false);
    }

};


function mapStateToProps(state) {
    return {
        aggregateReport: selectors.aggregateReport(state),
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
