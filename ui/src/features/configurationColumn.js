import { TableHeader } from '../components/ReactTable';
import React, { useState } from 'react';
import { get } from 'lodash';
import Checkbox from '../components/Checkbox/Checkbox';

import Moment from 'moment';
import 'font-awesome/css/font-awesome.min.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEye,
  faRedo,
  faRunning,
  faCloudDownloadAlt,
  faStopCircle,
  faTrashAlt,
  faClone,
  faPen
} from '@fortawesome/free-solid-svg-icons'
import classnames from 'classnames';
import css from './configurationColumn.scss';
import env from '../App/common/env';
import { v4 as uuid } from 'uuid';
import TooltipWrapper from '../components/TooltipWrapper';
import { getTimeFromCronExpr } from './utils';
import UiSwitcher from '../components/UiSwitcher';
import TextArea from '../components/TextArea';
import ClickOutHandler from 'react-onclickout'

const iconsWidth = 50;
const mediumSize = 60;
const semiLarge = 70;
const largeSize = 85;
const extraLargeSize = 100;
const extraExLargeSize = 120;
export const getColumns = ({ columnsNames, sortHeader = '', onSort, onReportView, onRawView, onStop, onDelete, onEdit, onRunTest, onEnableDisable, onEditNote, selectedReports, onReportSelected, onClone }) => {
  const columns = [
    {
      id: 'compare',
      Header: () => (
        <TableHeader sortable={false}>
          Cmp
        </TableHeader>
      ),
      accessor: (data) => <CompareCheckbox onReportSelected={onReportSelected} selectedReports={selectedReports}
        data={data} />,
      width: iconsWidth
    }, {
      id: 'report_id',
      Header: () => (
        <TableHeader padding={'8px'} sortable={false}>
          Test Name
        </TableHeader>
      ),
      accessor: 'report_id'
    },
    {
      id: 'name',
      Header: () => (
        <TableHeader padding={'8px'} sortable={false}>
          Test Name
        </TableHeader>
      ),
      accessor: 'name',
      minWidth: 170
    }, {
      id: 'processor_name',
      Header: () => (
        <TableHeader padding={'8px'} sortable={false}>
          Processor Name
        </TableHeader>
      ),
      accessor: 'name'
    },
    {
      id: 'experiment_name',
      Header: () => (
        <TableHeader padding={'8px'} sortable={false}>
          Experiment Name
        </TableHeader>
      ),
      accessor: 'name'
    },
    {
      id: 'description',
      Header: () => (
        <TableHeader padding={'8px'} sortable={false}>
          Description
        </TableHeader>
      ),
      // Ellipsis instead of a hard clip into the next column; full text on hover.
      accessor: data => (
        <span className={css['ellipsis-cell']} title={data.description}>{data.description}</span>
      )
    }, {
      id: 'kind',
      Header: () => (
        <TableHeader padding={'8px'} sortable={false}>
          Kind
        </TableHeader>
      ),
      accessor: 'kind'
    }, {
      // Chaos Mesh durations are spec strings ("1m", "30s") — shown as-is, unlike
      // the report `duration` column below which pretty-prints seconds. Two ids,
      // because getColumns resolves by first match.
      id: 'experiment_duration',
      Header: () => (
        <TableHeader padding={'8px'} sortable={false}>
          Duration
        </TableHeader>
      ),
      accessor: 'duration'
    },
    {
      id: 'updated_at',
      Header: () => (
        <TableHeader padding={'8px'} sortable
          up={sortHeader.indexOf('updated_at') > -1 && sortHeader.indexOf('+') > -1}
          down={sortHeader.indexOf('updated_at') > -1 && sortHeader.indexOf('-') > -1}
          onClick={() => {
            onSort('updated_at')
          }}
        >
          Modified
        </TableHeader>
      ),
      accessor: (data) => (dateFormatter(data.updated_at)),
      width: extraExLargeSize + 20,
      className: css['center-flex']
    },
    {
      id: 'created_at',
      Header: () => (
        <TableHeader padding={'8px'} sortable
          up={sortHeader.indexOf('created_at') > -1 && sortHeader.indexOf('+') > -1}
          down={sortHeader.indexOf('created_at') > -1 && sortHeader.indexOf('-') > -1}
          onClick={() => {
            onSort('created_at')
          }}
        >
          Created
        </TableHeader>
      ),
      accessor: (data) => (dateFormatter(data.updated_at)),
      width: extraExLargeSize + 20,
      className: css['center-flex']
    }, {
      id: 'type',
      Header: () => (
        <TableHeader padding={'8px'} sortable={false}>
          Type
        </TableHeader>
      ),
      accessor: 'type',
      width: iconsWidth,
      className: css['center-flex']
    }, {
      id: 'edit',
      Header: () => (
        <TableHeader sortable={false}>
          Edit
        </TableHeader>
      ),
      accessor: data => data.type === 'basic' ? <ViewButton icon={faPen} onClick={(e) => {
        e.stopPropagation();
        onEdit(data)
      }} />
        : <TooltipWrapper
          content={
            <div>
              DSL not supported
            </div>}
          dataId={
            'tooltipKey'}
          place='top'
          offset={{ top: 1 }}
        >
          <div data-tip data-for={'tooltipKey_na'} style={{ cursor: 'pointer', width: '18px' }}>
            N/A
          </div>
        </TooltipWrapper>,
      width: iconsWidth,
      className: css['center-flex']
    },
    {
      id: 'processor_edit',
      Header: () => (
        <TableHeader sortable={false}>
          Edit
        </TableHeader>
      ),
      accessor: data => <ViewButton icon={faPen} onClick={(e) => {
        e.stopPropagation();
        onEdit(data)
      }} />,
      width: iconsWidth,
      className: css['center-flex']
    },
    {
      id: 'experiment_edit',
      Header: () => (
        <TableHeader sortable={false}>
          Edit
        </TableHeader>
      ),
      accessor: data => <ViewButton icon={faPen} onClick={(e) => {
        e.stopPropagation();
        onEdit(data)
      }} />,
      width: iconsWidth,
      className: css['center-flex']
    },
    {
      id: 'job_edit',
      Header: () => (
        <TableHeader sortable={false}>
          Edit
        </TableHeader>
      ),
      accessor: data => <ViewButton icon={faPen} onClick={(e) => {
        e.stopPropagation();
        onEdit(data)
      }} />,
      width: iconsWidth,
      className: css['center-flex']
    },
    {
      id: 'test_name',
      Header: () => (
        <TableHeader padding={'8px'} sortable={false}>
          Test Name
        </TableHeader>
      ),
      accessor: data => (
        <span className={css['ellipsis-cell']} title={data.test_name} style={{ color: 'var(--fg-primary)' }}>{data.test_name}</span>
      ),
      // The identifying column never loses space to icon columns.
      minWidth: 170
    },
    {
      id: 'start_time',
      Header: () => (
        <TableHeader padding={'8px'} sortable
          up={sortHeader.indexOf('start_time') > -1 && sortHeader.indexOf('+') > -1}
          down={sortHeader.indexOf('start_time') > -1 && sortHeader.indexOf('-') > -1}
          onClick={() => {
            onSort('start_time')
          }}
        >
          Start Time
        </TableHeader>
      ),
      accessor: data => (dateFormatter(data.start_time)),
      width: extraExLargeSize,
      className: css['center-flex']
    },
    {
      id: 'end_time',
      Header: () => (
        <TableHeader padding={'8px'} sortable={false}>
          End Time
        </TableHeader>
      ),
      accessor: data => (dateFormatter(data.end_time)),
      width: extraExLargeSize,
      className: css['center-flex']
    },
    {
      id: 'duration',
      Header: () => (
        <TableHeader padding={'8px'} sortable={false}>
          Duration
        </TableHeader>
      ),
      accessor: data => (<span className={css['time-cell']}>{shortDuration(data.duration)}</span>),
      width: largeSize
      // className: css['center-flex'],
    },
    {
      id: 'status',
      Header: () => (
        <TableHeader padding={'8px'} sortable={false}>
          Status
        </TableHeader>
      ),
      accessor: data => statusFormatter(data.status),
      width: extraLargeSize + 20
    },
    {
      id: 'arrival_rate',
      Header: () => (
        <TableHeader sortable={false}>
          Rate
        </TableHeader>
      ),
      accessor: data => data.arrival_rate || data.arrival_count,
      width: mediumSize,
      className: css['center-flex']
    },
    {
      id: 'ramp_to',
      Header: () => (
        <TableHeader padding={'8px'} sortable={false}>
          Ramp
        </TableHeader>
      ),
      accessor: data => (data.ramp_to || <span className={css['metric--muted']}>–</span>),
      width: mediumSize,
      className: css['center-flex']
    },
    {
      id: 'max_virtual_users',
      Header: () => (
        <TableHeader padding={'8px'} sortable={false}>
          Max Virtual Users
        </TableHeader>
      ),
      accessor: data => (data.max_virtual_users || <span className={css['metric--muted']}>–</span>),
      width: extraExLargeSize,
      className: css['center-flex']
    },
    {
      id: 'cron_expression',
      Header: () => (
        <TableHeader padding={'8px'} sortable={false}>
          Cron Expression
        </TableHeader>
      ),
      accessor: data => (getTimeFromCronExpr(data.cron_expression) || <span className={css['metric--muted']}>–</span>),
      width: extraExLargeSize,
      className: css['center-flex']
    },
    {
      id: 'last_run',
      Header: () => (
        <TableHeader padding={'8px'} sortable={false}>
          Last Run
        </TableHeader>
      ),
      // The selector fills 'N/A' when a job has never run.
      accessor: data => ((data.last_run && data.last_run !== 'N/A')
        ? dateFormatter(data.last_run)
        : <span className={css['metric--muted']}>–</span>)
      // minWidth: 150
    },

    {
      id: 'last_success_rate',
      Header: () => (
        <TableHeader sortable={false}>
          Success
        </TableHeader>
      ),
      accessor: data => successRateFormatter(data.last_success_rate),
      width: extraLargeSize + 10
    },
    {
      id: 'avg_rps',
      Header: () => (
        <TableHeader sortable={false}>
          RPS
        </TableHeader>
      ),
      accessor: data => metricFormatter(Math.floor(data.avg_rps === undefined ? data.last_rps : data.avg_rps)),
      width: iconsWidth
    },

    {
      id: 'parallelism',
      Header: () => (
        <TableHeader padding={'8px'} sortable={false}>
          Runners
        </TableHeader>
      ),
      accessor: 'parallelism',
      width: semiLarge,
      className: css['center-flex']
    },
    {
      id: 'notes',
      Header: () => (
        <TableHeader sortable={false}>
          Notes
        </TableHeader>
      ),
      accessor: data => <Notes key={data.report_id} data={data} onEditNote={onEditNote} />
    },
    {
      id: 'score',
      Header: () => (
        <TableHeader sortable={false}>
          Score
        </TableHeader>
      ),
      accessor: (data) => {
        if (data.score) {
          const held = get(data, 'benchmark_weights_data.benchmark_threshold', 0) <= data.score;
          return (
            <span className={classnames(css.score, css[held ? 'score--held' : 'score--breach'])}
              title={held ? 'Meets benchmark threshold' : 'Below benchmark threshold'}>
              {Math.floor(data.score)}
            </span>
          );
        }
      },
      width: iconsWidth
    }, {
      id: 'report',
      Header: () => (
        <TableHeader padding={'8px'} sortable={false}>
          Report
        </TableHeader>
      ),
      accessor: data => <ViewButton onClick={(e) => {
        e.stopPropagation();
        onReportView(data)
      }} />,
      width: mediumSize
    },
    {
      id: 'grafana_report',
      Header: () => (
        <TableHeader sortable={false}>
          Grafana
        </TableHeader>
      ),
      accessor: data => <ViewButton onClick={(e) => {
        e.stopPropagation();
        window.open(data.grafana_report, '_blank')
      }} />,
      // "Grafana" at the header's tracking needs more than mediumSize or it clips.
      width: semiLarge
    },
    {
      id: 'raw',
      Header: () => (
        <TableHeader sortable={false}>
          Raw
        </TableHeader>
      ),
      accessor: data => <ViewButton icon={faEye} onClick={(e) => {
        e.stopPropagation();
        onRawView(data)
      }} />,
      width: iconsWidth,
      className: css['center-flex']
    },
    {
      id: 'rerun',
      Header: () => (
        <TableHeader sortable={false}>
          Rerun
        </TableHeader>
      ),
      accessor: data => <ViewButton icon={faRedo} onClick={(e) => {
        e.stopPropagation();
        onRunTest(data)
      }} />,
      width: iconsWidth
    },
    {
      id: 'run_now',
      Header: () => (
        <TableHeader padding={'8px'} sortable={false}>
          Run Now
        </TableHeader>
      ),
      accessor: data => <ViewButton icon={faRunning} onClick={(e) => {
        e.stopPropagation();
        onRunTest(data)
      }} />,
      width: semiLarge,
      className: css['center-flex']
    },
    {
      id: 'delete',
      Header: () => (
        <TableHeader sortable={false}>
          Delete
        </TableHeader>
      ),
      accessor: data => <ViewButton icon={faTrashAlt} onClick={(e) => {
        e.stopPropagation();
        onDelete(data)
      }} />,
      width: mediumSize,
      className: css['center-flex']
    }, {
      id: 'clone',
      Header: () => (
        <TableHeader sortable={false}>
          Clone
        </TableHeader>
      ),
      accessor: data => <ViewButton icon={faClone} onClick={(e) => {
        e.stopPropagation();
        onClone(data)
      }} />,
      width: mediumSize,
      className: css['center-flex']
    },
    {
      id: 'run_test',
      Header: () => (
        <TableHeader padding={'8px'} sortable={false}>
          Run Test
        </TableHeader>
      ),
      accessor: data => <ViewButton text={'Run'} onClick={(e) => {
        e.stopPropagation();
        onRunTest(data)
      }} />,
      width: semiLarge,
      className: css['center-flex']
    }, {
      id: 'logs',
      Header: () => (
        <TableHeader sortable={false}>
          Logs
        </TableHeader>
      ),
      accessor: data => (<ViewButton icon={faCloudDownloadAlt}
        onClick={(e) => {
          e.stopPropagation();
          window.open(`${env.PREDATOR_URL}/jobs/${data.job_id}/runs/${data.report_id}/logs`, '_blank')
        }} />),
      width: iconsWidth

    }, {
      id: 'stop',
      Header: () => (
        <TableHeader sortable={false}>
          Stop
        </TableHeader>
      ),
      accessor: (data) => {
        const disabled = (data.status !== 'in_progress' && data.status !== 'started');
        return (<ViewButton disabled={disabled} icon={faStopCircle} onClick={(e) => {
          e.stopPropagation();
          onStop(data)
        }} />)
      },
      width: iconsWidth
    },
    {
      id: 'enabled_disabled',
      Header: () => (
        <TableHeader sortable={false}>
          Enabled
        </TableHeader>
      ),
      accessor: (data) => {
        const activated = (typeof data.enabled === 'undefined' ? true : data.enabled);
        return (
          <div>
            <UiSwitcher
              onChange={(value) => {
                onEnableDisable(data, value)
              }}
              disabledInp={false}
              activeState={activated}
              height={12}
              width={22}
            />
          </div>)
      },
      width: semiLarge,
      className: css['center-flex']
    }
  ];

  return columnsNames.map((name) => {
    const column = columns.find((c) => c.id === name);
    if (!column) {
      throw new Error(`column ${name} not found`);
    }
    return column;
  });
};

// "2m 45s" instead of "2 minutes, 45 seconds": a duration is a measured value
// and fits its column at any magnitude.
const shortDuration = (totalSeconds) => {
  const s = Number(totalSeconds);
  if (!Number.isFinite(s)) {
    return totalSeconds;
  }
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.round(s % 60);
  return [h && `${h}h`, m && `${m}m`, (sec || (!h && !m)) && `${sec}s`].filter(Boolean).join(' ');
};

// Timestamps are data cells: one mono line ("Jul 28, 21:51") that never wraps,
// with the full date carried on the title for anything older than this year.
const dateFormatter = (cell, row) => {
  if (!cell) {
    return 'Still running...';
  }
  const m = new Moment(cell).local();
  const sameYear = m.year() === new Moment().year();
  return (
    <span className={css['time-cell']} title={m.format('lll')}>
      {m.format(sameYear ? 'MMM D, HH:mm' : 'MMM D YYYY, HH:mm')}
    </span>
  );
};

const ViewButton = ({ onClick, icon, disabled, text }) => {
  const element = icon ? <FontAwesomeIcon
    className={classnames(css['icon'], { [css['action-style']]: !disabled, [css['disabled-button']]: disabled })}
    onClick={() => !disabled && onClick} icon={icon} /> : text || 'View';

  return (<div className={css['action-style']} onClick={onClick}>{element}</div>)
};

const CompareCheckbox = ({ data, onReportSelected, selectedReports }) => {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Checkbox
        indeterminate={false}
        checked={selectedReports && selectedReports[data.test_id] && selectedReports[data.test_id][data.report_id]}
        // disabled={}
        onChange={(value) => onReportSelected(data.test_id, data.report_id, value)}
      />
    </div>
  )
}
const Notes = ({ data, onEditNote }) => {
  const { report_id, test_id } = data;
  const notes = data.notes || '';
  const [editMode, setEditMode] = useState(false);
  const [editValue, setEditValue] = useState(notes);
  const id = uuid();
  const cell = notes.split('\n').map((row, index) => (<p key={index}>{row}</p>));

  function onKeyDown (e) {
    if (e.key === 'Enter') {
      save();
    }
  }

  function save () {
    if (editMode) {
      setEditMode(false);
      onEditNote(test_id, report_id, editValue);
    }
  }

  return (

    <TooltipWrapper
      disable={!notes}
      content={<div>
        {cell}
      </div>}
      dataId={`tooltipKey_${id}`}
      place='top'
      offset={{ top: 1 }}
    >
      <div data-tip data-for={`tooltipKey_${id}`} style={{ cursor: 'pointer', width: '100%', height: '100%' }}>
        {editMode &&
        <ClickOutHandler onClickOut={save}>
          <TextArea value={editValue} style={{ lineHeight: 'normal' }} onKeyDown={onKeyDown}
            onChange={(evt, value) => {
              setEditValue(evt.target.value)
            }} />
        </ClickOutHandler>
        }
        {!editMode &&
        <div onClick={() => onEditNote && setEditMode(true)}
          style={onEditNote && { cursor: 'pointer', width: '100%', height: '100%' }}>{editValue}</div>

        }
      </div>
    </TooltipWrapper>
  )
};

// Run lifecycle, not a verdict on the target. "Finished" means the run completed —
// whether the system held is carried by the success-rate bar and the report readouts,
// because a run can finish cleanly while the target was shedding 9% of requests.
const STATUS_MAP = {
  finished: { text: 'Finished', tone: 'held' },
  in_progress: { text: 'Running', tone: 'running' },
  started: { text: 'Starting', tone: 'running' },
  partially_finished: { text: 'Partial', tone: 'strain' },
  aborted: { text: 'Aborted', tone: 'idle' },
  failed: { text: 'Failed', tone: 'breach' }
};

const statusFormatter = (cell) => {
  const status = STATUS_MAP[cell];
  if (!status) {
    return cell;
  }
  return (
    <span className={css['status-cell']}>
      <span className={classnames(css.status, css[`status--${status.tone}`])}>
        {status.text}
      </span>
    </span>
  );
};

// A percentage is hard to scan in a column; pairing it with a short bar makes a
// degraded run visible before you read a single digit.
const successRateFormatter = (value) => {
  if (value === undefined || value === null || isNaN(value)) {
    return <span className={classnames(css.metric, css['metric--muted'])}>—</span>;
  }
  const rate = Math.floor(value);
  const tone = rate >= 99 ? 'held' : rate >= 95 ? 'strain' : 'breach';
  return (
    <span className={classnames(css.rate, css[`rate--${tone}`])}
      title={`${rate}% of requests succeeded`}>
      <span className={css.rate__track}>
        <span className={css.rate__fill} style={{ width: `${Math.max(0, Math.min(100, rate))}%` }} />
      </span>
      {rate}%
    </span>
  );
};

const metricFormatter = (value, suffix = '') => {
  if (value === undefined || value === null || value === '' || isNaN(value)) {
    return <span className={classnames(css.metric, css['metric--muted'])}>—</span>;
  }
  return <span className={css.metric}>{Number(value).toLocaleString()}{suffix}</span>;
};
