import React from 'react';

import Modal from '../Modal';
import {prettySeconds} from '../../utils';
import PieChart from '../PieChart'
import _ from 'lodash';

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
import Snackbar from "material-ui/Snackbar";
import Checkbox from "../../../components/Checkbox/Checkbox";

const REFRESH_DATA_INTERVAL = 30000;
const COLORS = [{stroke: "#8884d8", fill: "#8884d8"},
    {stroke: "#82ca9d", fill: "#82ca9d"},
    {stroke: "#ffc658", fill: "#ffc658"},
    {stroke: "#0935FC", fill: "#0935FC"},
];


class CompareReports extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            reportsList: [],
            mergedReports: this.mergeGraphs([]),
            filteredKeys: {}
        };
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps.aggregateReports !== this.props.aggregateReports) {
            const reportsList = this.props.aggregateReports.map((report) => ({
                name: report.alias,
                startTime: report.startTime,
                testName: report.testName,
                duration: report.duration,
                show: true
            }));

            this.setState({reportsList});
            this.setMergedReports(reportsList)
        }

    }

    setMergedReports = (reportsList) => {
        const reportsNames = reportsList.filter(cur => cur.show).map(cur => cur.name);
        const {aggregateReports} = this.props;
        const filteredData = aggregateReports.filter((report) => reportsNames.includes(report.alias));
        const mergedReports = this.mergeGraphs(filteredData);
        this.setState({mergedReports});
    };

    generateAreaChart = (data, keys, labelY, graphType, onSelectedGraphPropertyFilter, filteredKeys) => {

        const filteredData = this.filterKeysFromArrayOfObject(data, graphType, filteredKeys);

        return (
            <ResponsiveContainer width="100%" height={300}>
                <AreaChart
                    width={700}
                    height={400}
                    data={filteredData}
                    margin={{
                        top: 10, right: 30, left: 0, bottom: 0,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3"/>
                    <XAxis dataKey="name"/>
                    <YAxis label={labelY} domain={[0, dataMax => Math.round(dataMax * 1.1)]}/>
                    <Legend content={(props) => renderLegend({
                        ...props,
                        graphType,
                        onSelectedGraphPropertyFilter,
                        filteredKeys
                    })}/>
                    <Tooltip/>
                    {
                        keys.map((key, index) => {
                            const color = COLORS[index % COLORS.length];
                            return (<Area connectNulls key={index} type="monotone" dataKey={key}
                                          stroke={color.stroke} fill={color.fill}/>)
                        })
                    }
                </AreaChart>
            </ResponsiveContainer>
        )
    }

    filterKeysFromArrayOfObject = (data, graphType, filteredKeys) => {

        const keysToFilter = Object.keys(_.pickBy(filteredKeys, (value) => value));
        const filteredData = data.reduce((acc, cur) => {
            acc.push(_.omitBy(cur, (value, key) => {
                return keysToFilter.includes(`${graphType}${key}`)
            }));
            return acc;
        }, []);

        return filteredData;
    }
    lineChart = (data, keys = [], labelY, graphType, onSelectedGraphPropertyFilter, filteredKeys) => {
        const data1 = [
            {
                "name": "4:52:32",
                "B_median": 560.4,
                "B_p95": 1584.2,
                "B_p99": 1874.6,
                "timeMills": 1585835552215
            },
            {
                "name": "4:52:33",
                "A_median": 305.6,
                "A_p95": 1463.6,
                "A_p99": 1833.9,
                "timeMills": 1585835553279
            },
            {
                "name": "4:53:02",
                "B_median": 1849.5,
                "B_p95": 4508.3,
                "B_p99": 4837,
                "timeMills": 1585835582215
            },
            {
                "name": "4:53:03",
                "A_median": 1631.8,
                "A_p95": 4487.7,
                "A_p99": 4853.2,
                "timeMills": 1585835583279
            }
        ]

        const filteredData = this.filterKeysFromArrayOfObject(data, graphType, filteredKeys);

        return (
            <ResponsiveContainer width="100%" height={300}>
                <LineChart
                    width={700}
                    height={400}
                    data={filteredData}
                    margin={{
                        top: 10, right: 30, left: 0, bottom: 0,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3"/>
                    <XAxis dataKey="name" allowDuplicatedCategory={false}/>
                    <YAxis label={labelY} domain={[0, dataMax => Math.round(dataMax * 1.1)]}/>
                    <Legend content={(props) => renderLegend({
                        ...props,
                        graphType,
                        onSelectedGraphPropertyFilter,
                        filteredKeys
                    })}/>
                    <Tooltip/>
                    {
                        keys.map((key, index) => {
                            const color = COLORS[index % COLORS.length];
                            return (<Line connectNulls key={index} type="monotone" dataKey={key} dot={null}
                                          stroke={color.stroke}/>)
                        })
                    }
                </LineChart>
            </ResponsiveContainer>
        )
    }

    barChart = (data, keys, graphType, onSelectedGraphPropertyFilter, filteredKeys) => {
        const filteredData = this.filterKeysFromArrayOfObject(data, graphType, filteredKeys);

        return (
            <ResponsiveContainer width={'100%'} height={300}>
                <BarChart
                    height={300}
                    data={filteredData}
                    margin={{
                        top: 20, right: 30, left: 20, bottom: 5,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3"/>
                    <XAxis dataKey="name"/>
                    <YAxis/>
                    <Legend content={(props) => renderLegend({
                        ...props,
                        graphType,
                        onSelectedGraphPropertyFilter,
                        filteredKeys
                    })}/>
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
    createBenchmark = () => {
        const {aggregateReport, report} = this.props;
        this.props.createBenchmark(report.test_id, aggregateReport.benchMark);
    };
    onSelectedReport = (value, index) => {
        const {reportsList} = this.state;
        reportsList[index].show = value;
        this.setState({reportsList: [...reportsList]})
        this.setMergedReports(reportsList);
    };
    onSelectedGraphPropertyFilter = (graphType, key, value) => {
        const {filteredKeys} = this.state;
        filteredKeys[`${graphType}${key}`] = !value;
        this.setState({filteredKeys: {...filteredKeys}});

        // this.setMergedReports(reportsList);

    };

    render() {
        const {reportsList, mergedReports, filteredKeys} = this.state;
        const {onClose} = this.props;
        return (
            <Modal onExit={onClose}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    // alignItems: 'center'
                }}>
                    <h1>Compare reports</h1>
                    <ReportsList onChange={this.onSelectedReport} list={reportsList}/>
                    <div style={{flex: 1}}>

                        <h3>Overall Latency</h3>
                        {/*<Button hover onClick={this.createBenchmark}>Create Benchmark</Button>*/}

                        {this.lineChart(mergedReports.latencyGraph, mergedReports.latencyGraphKeys, 'ms', 'latency', this.onSelectedGraphPropertyFilter, filteredKeys)}
                        <h3>Status Codes</h3>
                        {this.lineChart(mergedReports.errorsCodeGraph, mergedReports.errorsCodeGraphKeys, undefined, 'status_codes', this.onSelectedGraphPropertyFilter, filteredKeys)}
                        <h3>RPS</h3>
                        {this.generateAreaChart(mergedReports.rps, mergedReports.rpsKeys, 'rps', 'rps', this.onSelectedGraphPropertyFilter, filteredKeys)}
                        <div style={{width: '50%'}}>
                            <h3>Status Codes And Errors Distribution</h3>
                            {this.barChart(mergedReports.errorsBar, mergedReports.errorsBarKeys, 'status_codes_errors', this.onSelectedGraphPropertyFilter, filteredKeys)}
                        </div>
                        <div>
                            <h3>Scenarios</h3>
                            <PieChart data={mergedReports.scenarios}/>
                        </div>
                    </div>
                </div>
                <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'flex-end'}}>
                    {/*    <Button inverted onClick={onClose}>Close</Button>*/}
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
        const {getAggregateReports, selectedReports} = this.props;
        const selectedReportsAsList = Object.entries(selectedReports)
            .flatMap(selectedReport => {
                const testId = selectedReport[0];
                const selectedList = Object.entries(selectedReport[1])
                    .filter((isSelected) => isSelected[1])
                    .map((pairs) => pairs[0]);
                return selectedList.map((reportId) => {
                    return {
                        testId,
                        reportId
                    }
                })
            });
        getAggregateReports(selectedReportsAsList);
    };

    mergeGraphs = (data) => {
        const initial = {
            latencyGraph: [],
            latencyGraphKeys: [],
            errorsCodeGraph: [],
            errorsCodeGraphKeys: [],
            rps: [],
            rpsKeys: [],
            errorsBar: [],
            errorsBarKeys: [],
            scenarios: []
        };
        if (data.length === 0) {
            return initial;
        }

        //merged sorted data by time
        const result = data.reduce((acc, cur) => {
            acc.latencyGraph = mergeSortedArraysByStartTime(acc.latencyGraph, cur.latencyGraph);
            acc.latencyGraphKeys = acc.latencyGraphKeys.concat(cur.latencyGraphKeys);

            acc.errorsCodeGraph = mergeSortedArraysByStartTime(acc.errorsCodeGraph, cur.errorsCodeGraph);
            acc.errorsCodeGraphKeys = acc.errorsCodeGraphKeys.concat(cur.errorsCodeGraphKeys);

            acc.rps = mergeSortedArraysByStartTime(acc.rps, cur.rps);
            acc.rpsKeys = acc.rpsKeys.concat(cur.rpsKeys);

            acc.errorsBar = acc.errorsBar.concat(cur.errorsBar);
            acc.errorsBarKeys = acc.errorsBarKeys.concat(cur.errorsBarKeys);

            acc.scenarios = acc.scenarios.concat(cur.scenarios);
            return acc;
        }, initial)

        return result;

        ///convert to graph data
        const latencyGraph = result.latencyGraphKeys
            .flatMap((key) => {
                const allKeyValues = result.latencyGraph.flatMap((data) => {
                    if (data[key]) {
                        return {category: data.name, value: data[key]}
                    }
                    return [];
                });

                return {
                    name: key,
                    data: allKeyValues
                }
            })

        return {
            latencyGraph
        }
    }


    componentDidMount() {
        this.loadData();
        this.refreshDataInterval = setInterval(this.loadData, REFRESH_DATA_INTERVAL)
    }


    componentWillUnmount() {
        clearInterval(this.refreshDataInterval);
        this.props.getAggregateReportSuccess([])
    }

};


function mapStateToProps(state) {
    return {
        aggregateReports: selectors.getAggregateReportsForCompare(state),
        createBenchmarkSucceed: selectors.createBenchmarkSuccess(state),
    }
}

const mapDispatchToProps = {
    getAggregateReports: Actions.getAggregateReports,
    createBenchmark: Actions.createBenchmark,
    createBenchmarkSuccess: Actions.createBenchmarkSuccess,
    getAggregateReportSuccess: Actions.getAggregateReportSuccess,
};

const Block = ({header, dataList, style = {}}) => {
    const headerStyle = {color: '#577DFE', fontWeight: '500'};

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center', ...style
        }}>
            <div style={headerStyle}>{header}</div>
            {dataList.map((element, index) => (
                <div style={{display: 'flex', flex: 1, alignItems: 'center'}} key={index}>{element}</div>))}
        </div>
    )

};

const ReportsList = ({list = [], onChange}) => {
    const headerStyle = {marginRight: '10px'};
    const data = list.reduce((acc, cur, index) => {
        acc.symbols.push(cur.name);
        acc.testNames.push(cur.testName);
        acc.durations.push(prettySeconds(cur.duration));
        acc.startTimes.push(cur.startTime);
        acc.checkboxes.push(<Checkbox
            indeterminate={false}
            checked={cur.show}
            // disabled={}
            onChange={(value) => onChange(value, index)}
        />);
        return acc;
    }, {
        symbols: [],
        testNames: [],
        durations: [],
        startTimes: [],
        checkboxes: [],
    });


    return (
        <div style={{display: 'flex', flexDirection: 'row',justifyContent:'space-between'}}>
            <Block style={headerStyle} header={'Select'} dataList={data.checkboxes}/>
            <Block style={headerStyle} header={'Symbol'} dataList={data.symbols}/>
            <Block style={headerStyle} header={'Test Name'} dataList={data.testNames}/>
            <Block style={headerStyle} header={'Duration'} dataList={data.durations}/>
            <Block style={headerStyle} header={'Start Time'} dataList={data.startTimes}/>
        </div>
    );
};


export default connect(mapStateToProps, mapDispatchToProps)(CompareReports);


function mergeSortedArraysByStartTime(arr1, arr2) {
    const arr3 = [];

    let i = 0, j = 0;
    while (i < arr1.length && j < arr2.length) {

        if (arr1[i].timeMills < arr2[j].timeMills) {
            arr3.push(arr1[i]);
            i++;
        } else {
            arr3.push(arr2[j]);
            j++;
        }

    }
    while (i < arr1.length) {
        arr3.push(arr1[i]);
        i++;
    }
    while (j < arr2.length) {
        arr3.push(arr2[j]);
        j++;
    }
    return arr3;
}


const renderLegend = (props) => {
    const {payload, onSelectedGraphPropertyFilter, graphType, filteredKeys} = props;
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            flex: 1
        }}>
            {
                payload.map((entry, index) => (
                    <div key={`item-${index}`}
                         style={{margin: '5px', display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
                        <Checkbox
                            indeterminate={false}
                            checked={filteredKeys[`${graphType}${entry.value}`] === undefined || filteredKeys[`${graphType}${entry.value}`] === false}
                            // disabled={}
                            onChange={(value) => {
                                onSelectedGraphPropertyFilter(graphType, entry.value, value)
                            }}
                        />
                        <span style={{marginLeft: '5px', color: entry.color}}>{entry.value}</span>
                    </div>
                ))
            }
        </div>
    );
}
