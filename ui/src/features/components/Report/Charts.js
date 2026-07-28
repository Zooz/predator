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
  YAxis,
  ReferenceArea,
  ReferenceLine,
  Label
} from 'recharts';
import React from 'react';
import _ from 'lodash';
import Checkbox from '../../../components/Checkbox/Checkbox';
import { ReactTableComponent, TableHeader } from '../../../components/ReactTable';
import PieChart from '../PieChart';

// Chart colour comes from the design tokens, not literals: SVG presentation
// attributes resolve var(), so switching theme repaints every series with no
// JS plumbing. The order here is the validated categorical order — assigned by
// slot and never cycled past six (a 7th series folds into the six rather than
// inventing a hue).
const SERIES = [
  'var(--series-1)',
  'var(--series-2)',
  'var(--series-3)',
  'var(--series-4)',
  'var(--series-5)',
  'var(--series-6)'
];

const asColor = (token) => ({ stroke: token, fill: token });

// Latency percentiles are one measure at three confidence levels, so they read as
// a family: the same blue→violet progression every time, rather than an unrelated
// hue per percentile.
const COLOR_FAMILY = {
  median: [0, 1, 2, 3, 4].map(i => asColor(SERIES[i])),
  p95: [2, 3, 4, 5, 0].map(i => asColor(SERIES[i])),
  p99: [4, 5, 0, 1, 2].map(i => asColor(SERIES[i]))
};

const getColor = (key, index) => {
  const prefix = key.substring(0, 1);
  if (!(prefix.charCodeAt(0) >= 'A'.charCodeAt(0) && key.charAt(1) === '_')) {
    return asColor(SERIES[index % SERIES.length]);
  }

  const name = key.substring(2);
  const family = COLOR_FAMILY[name];
  const loc = prefix.charCodeAt(0) - 'A'.charCodeAt(0);
  if (family) {
    return family[loc % family.length];
  }
  return asColor(SERIES[loc % SERIES.length]);
};

// Recessive chart furniture: the grid and axes should never compete with the data.
export const AXIS_PROPS = {
  stroke: 'var(--plot-axis)',
  tick: { fill: 'var(--plot-tick)', fontSize: 11, fontFamily: 'var(--font-mono)' },
  tickLine: { stroke: 'var(--plot-grid)' }
};

export const GRID_PROPS = {
  stroke: 'var(--plot-grid)',
  strokeDasharray: '2 4',
  vertical: false
};

export const TOOLTIP_PROPS = {
  contentStyle: {
    background: 'var(--bg-surface-raised)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-md)',
    fontFamily: 'var(--font-ui)',
    fontSize: 12,
    color: 'var(--fg-primary)'
  },
  labelStyle: { color: 'var(--fg-secondary)', fontSize: 11, marginBottom: 4 },
  itemStyle: { color: 'var(--fg-primary)', fontSize: 12 },
  cursor: { stroke: 'var(--border-strong)', strokeWidth: 1, strokeDasharray: '3 3' }
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

export const BarChartPredator = ({ data = [], keys = [], graphType, onSelectedGraphPropertyFilter, filteredKeys }) => {
  const filteredData = filterKeysFromArrayOfObject(data, graphType, filteredKeys);

  return (
    <ResponsiveContainer width={'100%'} height={300}>
      <BarChart
        height={300}
        data={filteredData}
        margin={{
          top: 20, right: 30, left: 20, bottom: 5
        }}
      >
        <CartesianGrid {...GRID_PROPS} />
        <XAxis dataKey='name' {...AXIS_PROPS} />
        <YAxis {...AXIS_PROPS} width={54} />
        <Legend content={(props) => renderLegend({
          ...props,
          graphType,
          onSelectedGraphPropertyFilter,
          filteredKeys
        })} />
        <Tooltip {...TOOLTIP_PROPS} />
        {
          keys.map((key, index) => {
            const color = getColor(key, index);
            return (<Bar barSize={38} key={index} dataKey={key} fill={color.fill}
              radius={[4, 4, 0, 0]} stroke='var(--plot-surface)' strokeWidth={2} />)
          })
        }
      </BarChart>
    </ResponsiveContainer>
  )
};

export const LineChartPredator = ({ data = [], keys = [], labelY, maxY, graphType, onSelectedGraphPropertyFilter, filteredKeys, referenceAreas = {}, connectNulls = true }) => {
  const { experiments = [] } = referenceAreas;
  const filteredData = filterKeysFromArrayOfObject(data, graphType, filteredKeys);
  return <ResponsiveContainer width='100%' height={300}>
    <LineChart
      width={700}
      height={400}
      data={filteredData}
      margin={{
        top: 10, right: 30, left: 0, bottom: 0
      }}
    >
      <CartesianGrid {...GRID_PROPS} />
      <XAxis dataKey='name' allowDuplicatedCategory={false} {...AXIS_PROPS} />
      <YAxis
        {...AXIS_PROPS}
        width={54}
        label={{
          value: labelY,
          angle: 0,
          position: 'bottom',
          offset: 20,
          style: { textAnchor: 'middle', fill: 'var(--fg-secondary)', fontSize: 11 }
        }}
        domain={[0, Math.round(maxY * 1.1)]} />
      <Legend content={(props) => renderLegend({
        ...props,
        graphType,
        onSelectedGraphPropertyFilter,
        filteredKeys
      })} />
      {
        experiments.map((experiment, index) => {
          const key = `experiment-${index}`;
          return (
            renderExperimentsReferenceLine(experiment, key)
          )
        })
      }
      {
        experiments.map((experiment, index) => {
          const key = `experiment-${index}`;
          return (
            renderExperimentsReferenceArea(experiment, key)
          )
        })
      }
      <Tooltip {...TOOLTIP_PROPS} />
      {
        keys.map((key, index) => {
          const color = getColor(key, index);
          return <Line connectNulls={connectNulls} key={index} type='monotone' dataKey={key} dot={false}
            strokeWidth={2}
            activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--plot-surface)' }}
            stroke={color.stroke} />
        })
      }
    </LineChart>
  </ResponsiveContainer>
}

const renderExperimentsReferenceLine = (experiment, index) => {
  return (
    <ReferenceLine
      key={`experiment-${index}-line`}
      isFront
      x={experiment.startTime}
      stroke='var(--strain-fg)'
      strokeDasharray='2 2'
    >
      <Label value={experiment.label} position={'insideBottomLeft'} fill={'red'} />
    </ReferenceLine>
  );
}

const renderExperimentsReferenceArea = (experiment, index) => {
  return (
    <ReferenceArea
      key={`experiment-${index}-area`}
      x1={experiment.startTime}
      x2={experiment.endTime}
      stroke='red'
      strokeOpacity={0.3}
      fillOpacity={0.1}
      isFront
    />
  );
}

const renderLegend = (props) => {
  const { payload, onSelectedGraphPropertyFilter, graphType, filteredKeys } = props;
  if (payload.length === 1) {
    return null;
  }
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      flexWrap: 'wrap',
      gap: '4px 14px',
      paddingLeft: '54px',
      flex: 1
    }}>
      {
        payload.map((entry, index) => (
          <div key={`item-${index}`}
            style={{ margin: '5px', display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
            <Checkbox
              indeterminate={false}
              checked={_.get(filteredKeys, `${graphType}.${entry.value}`) === undefined || _.get(filteredKeys, `${graphType}.${entry.value}`) === false}
              // disabled={}
              onChange={(value) => {
                onSelectedGraphPropertyFilter(graphType, entry.value, value)
              }}
            />
            <span
              aria-hidden='true'
              style={{
                marginLeft: '6px',
                width: '10px',
                height: '2px',
                borderRadius: '1px',
                background: entry.color,
                flex: '0 0 auto'
              }}
            />
            <span style={{ marginLeft: '6px', color: 'var(--fg-secondary)', fontSize: '12px' }}>{entry.value}</span>
          </div>
        ))
      }
    </div>
  );
}

export const AssertionsReport = ({ data = { rows: [], headers: [] } }) => {
  const columnNumberSize = 100;

  const columns = [
    {
      id: 'requestName',
      Header: () => (
        <TableHeader padding={'8px'} sortable={false}>
          Request Name
        </TableHeader>
      ),
      accessor: data => data.assert_name
    }, {
      id: 'assertion',
      Header: () => (
        <TableHeader padding={'8px'} sortable={false}>
          Assertion
        </TableHeader>
      ),
      accessor: data => data.assertion
    },
    {
      id: 'fail',
      Header: () => (
        <TableHeader padding={'8px'} sortable={false}>
          Fail
        </TableHeader>
      ),
      accessor: data => data.fail,
      width: columnNumberSize
    }, {
      id: 'success',
      Header: () => (
        <TableHeader padding={'8px'} sortable={false}>
          Success
        </TableHeader>
      ),
      accessor: data => data.success,
      width: columnNumberSize
    }, {
      id: 'successRatio',
      Header: () => (
        <TableHeader padding={'8px'} sortable={false}>
          Success Ratio
        </TableHeader>
      ),
      accessor: data => data.success_ratio,
      width: columnNumberSize
    }, {
      id: 'failureResponses',

      Header: () => (
        <TableHeader padding={'8px'} sortable={false}>
          Failure responses
        </TableHeader>
      ),
      accessor: data => (
        <PieChart width={300} height={100} data={data.failure_responses} />
      ),
      width: 300
    }
  ]

  return (
    <ReactTableComponent
      style={{ width: '100%' }}
      tdStyle={{ display: 'flex', alignItems: 'center' }}
      manual={false}
      data={data.rows}
      columns={columns}
      noDataText={'noDataText'}
      showPagination={false}
      resizable={false}
      cursor={'default'}
    />
  );
}
