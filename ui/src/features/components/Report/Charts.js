import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from "recharts";
import React from "react";
import _ from "lodash";
import Checkbox from "../../../components/Checkbox/Checkbox";

const COLORS = [{stroke: "#8884d8", fill: "#8884d8"},
    {stroke: "#82ca9d", fill: "#82ca9d"},
    {stroke: "#ffc658", fill: "#ffc658"},
    {stroke: "#0935FC", fill: "#0935FC"},
    {stroke: "#395B56", fill: "#395B56"},
    {stroke: "#617A70", fill: "#617A70"},
    {stroke: "#CCC39F", fill: "#CCC39F"},
    {stroke: "#827e5b", fill: "#827e5b"},
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
const getColor = (key, index) => {
    const prefix = key.substring(0, 1);
    if (!(prefix.charCodeAt(0) >= 'A'.charCodeAt(0) && key.charAt(1) === '_')) {
        // its not with A_ prefix
        return COLORS[index % COLORS.length];
    }

    const name = key.substring(2);
    const family = COLOR_FAMILY[name] || COLORS;
    const loc = prefix.charCodeAt(0) - 'A'.charCodeAt(0);
    if (family) {
        return family[loc % family.length];
    }
    return COLORS[loc % COLORS.length];
};

const filterKeysFromArrayOfObject = (data, graphType, filteredKeys) => {
    const keysToFilter = Object.keys(_.pickBy(filteredKeys[graphType] || {}, (value) => value));
    const filteredData = data.reduce((acc, cur) => {
        acc.push(_.omitBy(cur, (value, key) => {
            return keysToFilter.includes(`${key}`)
        }));
        return acc;
    }, []);

    return filteredData;
};

export const BarChartPredator = ({data = [], keys=[], graphType, onSelectedGraphPropertyFilter, filteredKeys}) => {
    const filteredData = filterKeysFromArrayOfObject(data, graphType, filteredKeys);

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
                        const color = getColor(key, index);
                        return (<Bar barSize={50} key={index} dataKey={key} fill={color.fill}/>)
                    })
                }
            </BarChart>
        </ResponsiveContainer>
    )
};

export const LineChartPredator = ({data = [], keys = [], labelY, graphType, onSelectedGraphPropertyFilter, filteredKeys}) => {
    const filteredData = filterKeysFromArrayOfObject(data, graphType, filteredKeys);
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
                        const color = getColor(key, index);
                        return (<Line connectNulls key={index} type="monotone" dataKey={key} dot={null}
                                      stroke={color.stroke}/>)
                    })
                }
            </LineChart>
        </ResponsiveContainer>
    )
}


const renderLegend = (props) => {
    const {payload, onSelectedGraphPropertyFilter, graphType, filteredKeys} = props;
    if (payload.length === 1) {
        return null;
    }
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
                            checked={_.get(filteredKeys,`${graphType}.${entry.value}`) === undefined || _.get(filteredKeys,`${graphType}.${entry.value}`) === false}
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
