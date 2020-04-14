import React from 'react';

import Modal from '../Modal';
import {prettySeconds} from '../../utils';
import PieChart from '../PieChart'
import _ from 'lodash';

import {
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
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
import Button from "../../../components/Button";

const COLORS = [{stroke: "#8884d8", fill: "#8884d8"},
    {stroke: "#82ca9d", fill: "#82ca9d"},
    {stroke: "#ffc658", fill: "#ffc658"},
    {stroke: "#0935FC", fill: "#0935FC"},
    {stroke: "#395B56", fill: "#395B56"},
    {stroke: "#617A70", fill: "#617A70"},
    {stroke: "#CCC39F", fill: "#CCC39F"},
    {stroke: "#FFFAD1", fill: "#FFFAD1"},
];
const COLOR_FAMILY = {
    p95: [{stroke: "#BBDEF0", fill: "#BBDEF0"}, {stroke: "#00A6A6", fill: "#00A6A6"}, {
        stroke: "#EFCA08",
        fill: "#EFCA08"
    }, {stroke: "#F49F0A", fill: "#F49F0A"}, {stroke: "#F08700", fill: "#F08700"}],
    p99: [{stroke: "#134611", fill: "#134611"}, {stroke: "#3E8914", fill: "#3E8914"}, {
        stroke: "#3DA35D",
        fill: "#3DA35D"
    }, {stroke: "#96E072", fill: "#96E072"}, {stroke: "#ACFC4B", fill: "#ACFC4B"}],
    median: [{stroke: "#353531", fill: "#353531"}, {stroke: "#EC4E20", fill: "#EC4E20"}, {
        stroke: "#FF9505",
        fill: "#FF9505"
    }, {stroke: "#016FB9", fill: "#016FB9"}, {stroke: "#000000", fill: "#000000"}]
};
const getColor = (key) => {
    const prefix = key.substring(0, 1);
    const name = key.substring(2);
    const family = COLOR_FAMILY[name] || COLORS;
    const loc = prefix.charCodeAt(0) - 'A'.charCodeAt(0);
    if (family) {
        return family[loc % family.length];
    }
    return COLORS[loc % COLORS.length];
};


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

            const keysToDefaultFilter = reportsList.flatMap((reportInfo) => [`${reportInfo.name}_p95`, `${reportInfo.name}_p99`]);
            this.onSelectedGraphPropertyFilter('latency', keysToDefaultFilter, false);
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

    filterKeysFromArrayOfObject = (data, graphType, filteredKeys) => {

        const keysToFilter = Object.keys(_.pickBy(filteredKeys, (value) => value));
        const filteredData = data.reduce((acc, cur) => {
            acc.push(_.omitBy(cur, (value, key) => {
                return keysToFilter.includes(`${graphType}${key}`)
            }));
            return acc;
        }, []);

        return filteredData;
    };
    lineChart = (data, keys = [], labelY, graphType, onSelectedGraphPropertyFilter, filteredKeys) => {
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
                            const color = getColor(key);
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
                            const color = getColor(key);
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
        this.setState({reportsList: [...reportsList]});
        this.setMergedReports(reportsList);
    };
    onSelectedGraphPropertyFilter = (graphType, keys, value) => {
        const {filteredKeys} = this.state;
        let newFilteredKeys = {...filteredKeys};
        if (_.isArray(keys)) {
            newFilteredKeys = keys.reduce((acc, cur) => {
                acc[`${graphType}${cur}`] = !value;
                return acc;
            }, filteredKeys)
        } else {
            newFilteredKeys[`${graphType}${keys}`] = !value;
        }
        this.setState({filteredKeys: {...newFilteredKeys}});
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
                        {this.lineChart(mergedReports.latencyGraph, mergedReports.latencyGraphKeys, 'ms', 'latency', this.onSelectedGraphPropertyFilter, filteredKeys)}
                        <h3>Status Codes</h3>
                        {this.lineChart(mergedReports.errorsCodeGraph, mergedReports.errorsCodeGraphKeys, undefined, 'status_codes', this.onSelectedGraphPropertyFilter, filteredKeys)}
                        <h3>RPS</h3>
                        {this.lineChart(mergedReports.rps, mergedReports.rpsKeys, 'rps', 'rps', this.onSelectedGraphPropertyFilter, filteredKeys)}
                        <h3>Status Codes And Errors Distribution</h3>
                        {this.barChart(mergedReports.errorsBar, mergedReports.errorsBarKeys, 'status_codes_errors', this.onSelectedGraphPropertyFilter, filteredKeys)}
                        <div>
                            <h3>Scenarios</h3>
                            <PieChart data={mergedReports.scenarios}/>
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
        }, initial);

        return result;
    }


    componentDidMount() {
        this.loadData();
    }

    componentWillUnmount() {
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
        <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between'}}>
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
