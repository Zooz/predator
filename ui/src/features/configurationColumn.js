import {TableHeader} from "../components/ReactTable";
import React, {useEffect, useState} from "react";
import {get} from 'lodash';
import Checkbox from '../components/Checkbox/Checkbox';

import Moment from 'moment';
import prettySeconds from 'pretty-seconds';
import 'font-awesome/css/font-awesome.min.css';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {
    faEye,
    faRedo,
    faRunning,
    faCloudDownloadAlt,
    faStopCircle,
    faTrashAlt,
    faPen
} from '@fortawesome/free-solid-svg-icons'
import classnames from 'classnames';
import css from './configurationColumn.scss';
import env from "../App/common/env";
import {v4 as uuid} from "uuid";
import TooltipWrapper from '../components/TooltipWrapper';
import {getTimeFromCronExpr} from './utils';
import UiSwitcher from '../components/UiSwitcher';
import TextArea from "../components/TextArea";
import ClickOutHandler from 'react-onclickout'

const iconsWidth = 50;
const mediumSize = 60;
const semiLarge = 70;
const largeSize = 85;
const extraLargeSize = 100;
const extraExLargeSize = 120;
export const getColumns = ({columnsNames, sortHeader = '', onSort, onReportView, onRawView, onStop, onDelete, onEdit, onRunTest, onEnableDisable, onEditNote, selectedReports, onReportSelected}) => {

    const columns = [
        {
            id: 'compare',
            Header: () => (
                <TableHeader sortable={false}>
                    Select
                </TableHeader>
            ),
            accessor: (data) => <CompareCheckbox onReportSelected={onReportSelected} selectedReports={selectedReports}
                                                 data={data}/>,
            width: iconsWidth
        }, {
            id: 'report_id',
            Header: () => (
                <TableHeader sortable={false}>
                    Test Name
                </TableHeader>
            ),
            accessor: 'report_id',
        },
        {
            id: 'name',
            Header: () => (
                <TableHeader sortable={false}>
                    Test Name
                </TableHeader>
            ),
            accessor: 'name',
        }, {
            id: 'processor_name',
            Header: () => (
                <TableHeader sortable={false}>
                    Processor Name
                </TableHeader>
            ),
            accessor: 'name',
        },
        {
            id: 'description',
            Header: () => (
                <TableHeader sortable={false}>
                    Description
                </TableHeader>
            ),
            accessor: 'description'
        }, {
            id: 'updated_at',
            Header: () => (
                <TableHeader sortable={true}
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
            className: css['center-flex'],
        }, {
            id: 'type',
            Header: () => (
                <TableHeader sortable={false}>
                    Type
                </TableHeader>
            ),
            accessor: 'type',
            width: iconsWidth,
            className: css['center-flex'],
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
                }}/> :
                <TooltipWrapper
                    content={
                        <div>
                            DSL not supported
                        </div>}
                    dataId={
                        `tooltipKey`}
                    place='top'
                    offset={{top: 1}}
                >
                    <div data-tip data-for={`tooltipKey_na`} style={{cursor: 'pointer', width: '18px'}}>
                        N/A
                    </div>
                </TooltipWrapper>,
            width: iconsWidth,
            className: css['center-flex'],
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
            }}/>,
            width: iconsWidth,
            className: css['center-flex'],
        },
        {
            id: 'test_name',
            Header: () => (
                <TableHeader sortable={false}>
                    Test Name
                </TableHeader>
            ),
            accessor: 'test_name',


        },
        {
            id: 'environment',
            Header: () => (
                <TableHeader sortable={false}>
                    Environment
                </TableHeader>
            ),
            accessor: 'environment'
        },
        {
            id: 'start_time',
            Header: () => (
                <TableHeader sortable={true}
                             up={sortHeader.indexOf('start_time') > -1 && sortHeader.indexOf('+') > -1}
                             down={sortHeader.indexOf('start_time') > -1 && sortHeader.indexOf('-') > -1}
                             onClick={() => {
                                 onSort('start_time')
                             }}
                >
                    Start Time
                </TableHeader>
            ),
            accessor: data => (<div className={css['header-time']}>{dateFormatter(data.start_time)}</div>),
        },
        {
            id: 'end_time',
            Header: () => (
                <TableHeader sortable={false}>
                    End Time
                </TableHeader>
            ),
            accessor: data => (<div className={css['header-time']}>{dateFormatter(data.end_time)}</div>),
            width: extraLargeSize,
            className: css['center-flex'],
        },
        {
            id: 'duration',
            Header: () => (
                <TableHeader sortable={false}>
                    Duration
                </TableHeader>
            ),
            accessor: data => (prettySeconds(data.duration)),
            width: largeSize,
            className: css['center-flex'],
        },
        {
            id: 'status',
            Header: () => (
                <TableHeader sortable={false}>
                    Status
                </TableHeader>
            ),
            accessor: data => statusFormatter(data.status),
            width: mediumSize
        },
        {
            id: 'arrival_rate',
            Header: () => (
                <TableHeader sortable={false}>
                    Arrival Rate
                </TableHeader>
            ),
            accessor: 'arrival_rate',
            width: largeSize,
            className: css['center-flex'],
        },
        {
            id: 'ramp_to',
            Header: () => (
                <TableHeader sortable={false}>
                    Ramp To
                </TableHeader>
            ),
            accessor: data => (data.ramp_to || 'N/A'),
            width: largeSize,
            className: css['center-flex'],
        },
        {
            id: 'max_virtual_users',
            Header: () => (
                <TableHeader sortable={false}>
                    Max Virtual Users
                </TableHeader>
            ),
            accessor: data => (data.max_virtual_users || 'N/A'),
            width: extraExLargeSize,
            className: css['center-flex'],
        },
        {
            id: 'cron_expression',
            Header: () => (
                <TableHeader sortable={false}>
                    Cron Expression
                </TableHeader>
            ),
            accessor: data => (getTimeFromCronExpr(data.cron_expression) || 'N/A'),
            width: extraExLargeSize,
            className: css['center-flex'],
        },
        {
            id: 'last_run',
            Header: () => (
                <TableHeader sortable={false}>
                    Last Run
                </TableHeader>
            ),
            accessor: 'last_run',
            minWidth: 150
        },

        {
            id: 'last_success_rate',
            Header: () => (
                <TableHeader sortable={false}>
                    Success Rate
                </TableHeader>
            ),
            accessor: data => (Math.floor(data.last_success_rate) + '%'),
            width: extraLargeSize,
            className: css['center-flex'],
        },
        {
            id: 'avg_rps',
            Header: () => (
                <TableHeader sortable={false}>
                    RPS
                </TableHeader>
            ),
            accessor: data => (Math.floor(data.avg_rps === undefined ? data.last_rps : data.avg_rps)),
            width: iconsWidth,
            className: css['center-flex'],
        },

        {
            id: 'parallelism',
            Header: () => (
                <TableHeader sortable={false}>
                    Parallelism
                </TableHeader>
            ),
            accessor: 'parallelism',
            width: largeSize,
            className: css['center-flex'],
        },
        {
            id: 'notes',
            Header: () => (
                <TableHeader sortable={false}>
                    Notes
                </TableHeader>
            ),
            accessor: data => <Notes key={data.report_id} data={data} onEditNote={onEditNote}/>,
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
                    const color = get(data, 'benchmark_weights_data.benchmark_threshold', 0) <= data.score ? 'green' : 'red';
                    return (
                        <span className={css['center-flex']} style={{color}}>{Math.floor(data.score)}</span>
                    )
                }
            },
            width: iconsWidth
        }, {
            id: 'report',
            Header: () => (
                <TableHeader sortable={false}>
                    Report
                </TableHeader>
            ),
            accessor: data => <ViewButton onClick={(e) => {
                e.stopPropagation();
                onReportView(data)
            }}/>,
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
            }}/>,
            width: mediumSize
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
            }}/>,
            width: iconsWidth,
            className: css['center-flex'],
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
            }}/>,
            width: iconsWidth
        },
        {
            id: 'run_now',
            Header: () => (
                <TableHeader sortable={false}>
                    Run Now
                </TableHeader>
            ),
            accessor: data => <ViewButton icon={faRunning} onClick={(e) => {
                e.stopPropagation();
                onRunTest(data)
            }}/>,
            width: largeSize,
            className: css['center-flex'],
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
            }}/>,
            width: mediumSize,
            className: css['center-flex'],
        },
        {
            id: 'run_test',
            Header: () => (
                <TableHeader sortable={false}>
                    Run Test
                </TableHeader>
            ),
            accessor: data => <ViewButton text={'Run'} onClick={(e) => {
                e.stopPropagation();
                onRunTest(data)
            }}/>,
            width: semiLarge,
            className: css['center-flex'],
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
                                           }}/>),
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
                }}/>)
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
            className: css['center-flex'],
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


const dateFormatter = (cell, row) => {
    const timePattern = 'DD-MM-YYYY hh:mm:ss a';

    if (!cell) {
        return 'Still running...';
    } else {
        return (
            new Moment(cell).local().format('lll')
        );
    }
};

const ViewButton = ({onClick, icon, disabled, text}) => {

    const element = icon ? <FontAwesomeIcon
        className={classnames(css['icon'], {[css['action-style']]: !disabled, [css['disabled-button']]: disabled})}
        onClick={() => !disabled && onClick} icon={icon}/> : text || 'View';


    return (<div className={css['action-style']} onClick={onClick}>{element}</div>)
};

const CompareCheckbox = ({data, onReportSelected, selectedReports}) => {

    return (
        <div style={{width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <Checkbox
                indeterminate={false}
                checked={selectedReports && selectedReports[data.test_id] && selectedReports[data.test_id][data.report_id]}
                // disabled={}
                onChange={(value) => onReportSelected(data.test_id, data.report_id, value)}
            />
        </div>
    )
}
const Notes = ({data, onEditNote}) => {
    const {report_id, test_id} = data;
    const notes = data.notes || '';
    const [editMode, setEditMode] = useState(false);
    const [editValue, setEditValue] = useState(notes);
    const id = uuid();
    const cell = notes.split('\n').map((row) => (<p>{row}</p>));

    function onKeyDown(e) {
        if (e.key === 'Enter') {
            save();
        }
    }

    function save() {
        if (editMode) {
            setEditMode(false);
            onEditNote(test_id, report_id, editValue);
        }
    }

    return(

        <TooltipWrapper
            disable={!notes}
            content={<div>
                {cell}
            </div>}
            dataId={`tooltipKey_${id}`}
            place='top'
            offset={{top: 1}}
        >
            <div data-tip data-for={`tooltipKey_${id}`} style={{cursor: 'pointer', width: '100%', height: '100%'}}>
                {editMode &&
                <ClickOutHandler onClickOut={save}>
                    <TextArea value={editValue} style={{lineHeight: 'normal'}} onKeyDown={onKeyDown}
                              onChange={(evt, value) => {
                                  setEditValue(evt.target.value)
                              }}/>
                </ClickOutHandler>
                }
                {!editMode &&
        <div onClick={() => onEditNote && setEditMode(true)}
             style={onEditNote && {cursor: 'pointer', width: '100%', height: '100%'}}>{editValue}</div>

                }
            </div>
        </TooltipWrapper>
    )
};


const statusFormatter = (cell) => {
    let mapper = {
        'in_progress': 'Running',
        'aborted': 'Aborted',
        'finished': 'Finished',
        'started': 'Started',
        'partially_finished': 'Partially Finished',
        'failed': 'Failed'
    };
    return (mapper[cell] ? mapper[cell] : cell);
}


