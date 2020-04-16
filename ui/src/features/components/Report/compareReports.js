import React from 'react';

import Modal from '../Modal';
import {prettySeconds} from '../../utils';
import PieChart from '../PieChart'
import _ from 'lodash';
import {LineChartPredator, BarChartPredator} from './Charts'

import * as Actions from "../../redux/actions/reportsActions";
import * as selectors from "../../redux/selectors/reportsSelector";
import {connect} from "react-redux";
import Snackbar from "material-ui/Snackbar";
import Checkbox from "../../../components/Checkbox/Checkbox";
import Button from "../../../components/Button";


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
                        <LineChartPredator data={mergedReports.latencyGraph} keys={mergedReports.latencyGraphKeys}
                                           labelY={'ms'} graphType={'latency'}
                                           onSelectedGraphPropertyFilter={this.onSelectedGraphPropertyFilter}
                                           filteredKeys={filteredKeys}/>
                        <h3>Status Codes</h3>
                        <LineChartPredator data={mergedReports.errorsCodeGraph} keys={mergedReports.errorsCodeGraphKeys}
                                           graphType={'status_codes'}
                                           onSelectedGraphPropertyFilter={this.onSelectedGraphPropertyFilter}
                                           filteredKeys={filteredKeys}/>
                        <h3>RPS</h3>
                        <LineChartPredator data={mergedReports.rps} keys={mergedReports.rpsKeys} labelY={'rps'}
                                           graphType={'rps'}
                                           onSelectedGraphPropertyFilter={this.onSelectedGraphPropertyFilter}
                                           filteredKeys={filteredKeys}/>
                        <h3>Status Codes And Errors Distribution</h3>
                        <BarChartPredator data={mergedReports.errorsBar} keys={mergedReports.errorsBarKeys}
                                          graphType={'status_codes_errors'}
                                          onSelectedGraphPropertyFilter={this.onSelectedGraphPropertyFilter}
                                          filteredKeys={filteredKeys}/>
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

