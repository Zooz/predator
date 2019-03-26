import {TableHeader} from "../../../components/ReactTable";
import React from "react";
import {filter, sortedUniqBy} from 'lodash';
import Moment from 'moment';
import prettySeconds from 'pretty-seconds';
import 'font-awesome/css/font-awesome.min.css';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faEye, faCloudDownloadAlt, faStopCircle, faTrashAlt, faPen,faRunning} from '@fortawesome/free-solid-svg-icons'
import classnames from 'classnames';
import css from './configurationColumn.scss';
import env from "../../../App/common/env";
import {v4 as uuid} from "uuid";
import TooltipWrapper from '../../../components/TooltipWrapper';
import style from "./style.scss";
import {getTimeFromCronExpr} from './utils';


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
//TODO clean the code. all unused up/down /sortable

const ViewButton = ({onClick, icon, disabled,text}) => {
    if (icon) {
        return (<FontAwesomeIcon
            className={classnames(css['icon'], {[css['action-style']]: !disabled, [css['disabled-button']]: disabled})}
            onClick={!disabled && onClick} icon={icon}/>)
    }
    return (<div className={css['action-style']} onClick={onClick}>{text || 'View'}</div>)
};


const notes = (cell, row) => {
    if (cell) {
        const id = uuid();
        cell = cell.split('\n').map((row) => (<p>{row}</p>));
        return <TooltipWrapper
            content={<div>
                {cell}
            </div>}
            dataId={`tooltipKey_${id}`}
            place='top'
            offset={{top: 1}}
        >
            <div className={style.notes} data-tip data-for={`tooltipKey_${id}`} style={{cursor: 'pointer'}}>
                {cell}
            </div>

        </TooltipWrapper>;
    }
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
export const getColumns = ({columnsNames, sortHeader = '', onSort, onReportView, onRawView,onStop, onDelete, onEdit, onRunTest }) => {

    const columns = [
        {
            id: 'report_id',
            Header: () => (
                <TableHeader sortable={false}
                    // padding={text('headerPadding')}
                             up={sortHeader.indexOf('id') > -1 && sortHeader.indexOf('+') > -1}
                             down={sortHeader.indexOf('id') > -1 && sortHeader.indexOf('-') > -1}
                >
                    Test Name
                </TableHeader>
            ),
            accessor: 'report_id'
        },      {
            id: 'name',
            Header: () => (
                <TableHeader sortable={false}
                    // padding={text('headerPadding')}
                             up={sortHeader.indexOf('id') > -1 && sortHeader.indexOf('+') > -1}
                             down={sortHeader.indexOf('id') > -1 && sortHeader.indexOf('-') > -1}
                >
                    Test Name
                </TableHeader>
            ),
            accessor: 'name'
        },
        {
            id: 'description',
            Header: () => (
                <TableHeader sortable={false}
                    // padding={text('headerPadding')}
                             up={sortHeader.indexOf('id') > -1 && sortHeader.indexOf('+') > -1}
                             down={sortHeader.indexOf('id') > -1 && sortHeader.indexOf('-') > -1}
                >
                    Description
                </TableHeader>
            ),
            accessor: 'description'
        }, {
            id: 'updated_at',
            Header: () => (
                <TableHeader sortable={false}
                    // padding={text('headerPadding')}
                             up={sortHeader.indexOf('id') > -1 && sortHeader.indexOf('+') > -1}
                             down={sortHeader.indexOf('id') > -1 && sortHeader.indexOf('-') > -1}
                >
                    Modified
                </TableHeader>
            ),
            accessor: (data) => (dateFormatter(data.updated_at))
        }, {
            id: 'type',
            Header: () => (
                <TableHeader sortable={false}
                    // padding={text('headerPadding')}
                             up={sortHeader.indexOf('id') > -1 && sortHeader.indexOf('+') > -1}
                             down={sortHeader.indexOf('id') > -1 && sortHeader.indexOf('-') > -1}
                >
                    Type
                </TableHeader>
            ),
            accessor: 'type'
        }, {
            id: 'edit',
            Header: () => (
                <TableHeader sortable={false}
                    // padding={text('headerPadding')}
                             up={sortHeader.indexOf('id') > -1 && sortHeader.indexOf('+') > -1}
                             down={sortHeader.indexOf('id') > -1 && sortHeader.indexOf('-') > -1}
                >
                    Edit
                </TableHeader>
            ),
            accessor: data => data.type ==='basic' ? <ViewButton icon={faPen} onClick={() => onEdit(data)}/> : 'N/A',
            className: css['icon-cell']
        },
        {
            id: 'test_name',
            Header: () => (
                <TableHeader sortable={false}
                    // padding={text('headerPadding')}
                             up={sortHeader.indexOf('id') > -1 && sortHeader.indexOf('+') > -1}
                             down={sortHeader.indexOf('id') > -1 && sortHeader.indexOf('-') > -1}
                >
                    Test Name
                </TableHeader>
            ),
            accessor: 'test_name'
        },
        {
            id: 'environment',
            Header: () => (
                <TableHeader sortable={false}
                    // padding={text('headerPadding')}
                             up={sortHeader.indexOf('id') > -1 && sortHeader.indexOf('+') > -1}
                             down={sortHeader.indexOf('id') > -1 && sortHeader.indexOf('-') > -1}
                >
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
            accessor: data => (dateFormatter(data.start_time)),
            className: `${css['header-time']}`,
        },
        {
            id: 'end_time',
            Header: () => (
                <TableHeader sortable={false}
                    // padding={text('headerPadding')}
                             up={sortHeader.indexOf('orderId') > -1 && sortHeader.indexOf('+') > -1}
                             down={sortHeader.indexOf('orderId') > -1 && sortHeader.indexOf('-') > -1}>
                    End Time
                </TableHeader>
            ),
            accessor: data => (dateFormatter(data.end_time))
        },
        {
            id: 'duration',
            Header: () => (
                <TableHeader sortable={false}
                    // padding={text('headerPadding')}
                             up={sortHeader.indexOf('customerEmail') > -1 && sortHeader.indexOf('+') > -1}
                             down={sortHeader.indexOf('customerEmail') > -1 && sortHeader.indexOf('-') > -1}>
                    Duration
                </TableHeader>
            ),
            accessor: data => (prettySeconds(data.duration))
        },
        {
            id: 'status',
            Header: () => (
                <TableHeader sortable={false}>
                    Status
                </TableHeader>
            ),
            accessor: data => statusFormatter(data.status)
        },
        {
            id: 'arrival_rate',
            Header: () => (
                <TableHeader sortable={false}
                    // padding={text('headerPadding')}
                             up={sortHeader.indexOf('status') > -1 && sortHeader.indexOf('+') > -1}
                             down={sortHeader.indexOf('status') > -1 && sortHeader.indexOf('-') > -1}>
                    Arrival Rate
                </TableHeader>
            ),
            accessor: 'arrival_rate'
        },
        {
            id: 'ramp_to',
            Header: () => (
                <TableHeader sortable={false}
                    // padding={text('headerPadding')}
                             up={sortHeader.indexOf('created') > -1 && sortHeader.indexOf('+') > -1}
                             down={sortHeader.indexOf('created') > -1 && sortHeader.indexOf('-') > -1}>
                    Ramp To
                </TableHeader>
            ),
            accessor: data => (data.ramp_to || 'N/A')
        },
        {
            id: 'max_virtual_users',
            Header: () => (
                <TableHeader sortable={false}
                    // padding={text('headerPadding')}
                             up={sortHeader.indexOf('created') > -1 && sortHeader.indexOf('+') > -1}
                             down={sortHeader.indexOf('created') > -1 && sortHeader.indexOf('-') > -1}>
                    Max Virtual Users
                </TableHeader>
            ),
            accessor: data => (data.max_virtual_users || 'N/A')
        },
        {
            id: 'cron_expression',
            Header: () => (
                <TableHeader sortable={false}
                    // padding={text('headerPadding')}
                             up={sortHeader.indexOf('created') > -1 && sortHeader.indexOf('+') > -1}
                             down={sortHeader.indexOf('created') > -1 && sortHeader.indexOf('-') > -1}>
                    Cron Expression
                </TableHeader>
            ),
            accessor: data => (getTimeFromCronExpr(data.cron_expression) || 'N/A')
        },
        {
            id: 'last_run',
            Header: () => (
                <TableHeader sortable={false}
                    // padding={text('headerPadding')}
                             up={sortHeader.indexOf('created') > -1 && sortHeader.indexOf('+') > -1}
                             down={sortHeader.indexOf('created') > -1 && sortHeader.indexOf('-') > -1}>
                    Last Run
                </TableHeader>
            ),
            accessor: 'last_run'
        },

        {
            id: 'last_success_rate',
            Header: () => (
                <TableHeader sortable={false}
                    // padding={text('headerPadding')}
                             up={sortHeader.indexOf('created') > -1 && sortHeader.indexOf('+') > -1}
                             down={sortHeader.indexOf('created') > -1 && sortHeader.indexOf('-') > -1}>
                    Success Rate
                </TableHeader>
            ),
            accessor: data => (Math.floor(data.last_success_rate) + '%')
        },
        {
            id: 'last_rps',
            Header: () => (
                <TableHeader sortable={false}
                    // padding={text('headerPadding')}
                             up={sortHeader.indexOf('created') > -1 && sortHeader.indexOf('+') > -1}
                             down={sortHeader.indexOf('created') > -1 && sortHeader.indexOf('-') > -1}>
                    RPS
                </TableHeader>
            ),
            accessor: data => (Math.floor(data.last_rps))
        },

        {
            id: 'parallelism',
            Header: () => (
                <TableHeader sortable={false}
                    // padding={text('headerPadding')}
                             up={sortHeader.indexOf('created') > -1 && sortHeader.indexOf('+') > -1}
                             down={sortHeader.indexOf('created') > -1 && sortHeader.indexOf('-') > -1}>
                    Parallelism
                </TableHeader>
            ),
            accessor: 'parallelism'
        },
        {
            id: 'notes',
            Header: () => (
                <TableHeader sortable={false}
                    // padding={text('headerPadding')}
                             up={sortHeader.indexOf('created') > -1 && sortHeader.indexOf('+') > -1}
                             down={sortHeader.indexOf('created') > -1 && sortHeader.indexOf('-') > -1}>
                    Notes
                </TableHeader>
            ),
            accessor: data => notes(data.notes)
        }, {
            id: 'report',
            Header: () => (
                <TableHeader sortable={false}
                    // padding={text('headerPadding')}
                             up={sortHeader.indexOf('created') > -1 && sortHeader.indexOf('+') > -1}
                             down={sortHeader.indexOf('created') > -1 && sortHeader.indexOf('-') > -1}>
                    Report
                </TableHeader>
            ),
            accessor: data => <ViewButton onClick={() => onReportView(data)}/>
        },
        {
            id: 'grafana_report',
            Header: () => (
                <TableHeader sortable={false}
                    // padding={text('headerPadding')}
                             up={sortHeader.indexOf('created') > -1 && sortHeader.indexOf('+') > -1}
                             down={sortHeader.indexOf('created') > -1 && sortHeader.indexOf('-') > -1}>
                    Grafana
                </TableHeader>
            ),
            accessor: data => <ViewButton onClick={() => window.open(data.grafana_report, '_blank')}/>
        },
        {
            id: 'raw',
            Header: () => (
                <TableHeader sortable={false}
                    // padding={text('headerPadding')}
                             up={sortHeader.indexOf('created') > -1 && sortHeader.indexOf('+') > -1}
                             down={sortHeader.indexOf('created') > -1 && sortHeader.indexOf('-') > -1}>
                    Raw
                </TableHeader>
            ),
            accessor: data => <ViewButton icon={faEye} onClick={() => onRawView(data)}/>,
            className: css['icon-cell']
        },
        {
            id: 'delete',
            Header: () => (
                <TableHeader sortable={false}
                    // padding={text('headerPadding')}
                             up={sortHeader.indexOf('created') > -1 && sortHeader.indexOf('+') > -1}
                             down={sortHeader.indexOf('created') > -1 && sortHeader.indexOf('-') > -1}>
                    Delete
                </TableHeader>
            ),
            accessor: data => <ViewButton icon={faTrashAlt} onClick={() => onDelete(data)}/>,
            className: css['icon-cell']
        },
        {
            id: 'run_test',
            Header: () => (
                <TableHeader sortable={false}
                    // padding={text('headerPadding')}
                             up={sortHeader.indexOf('created') > -1 && sortHeader.indexOf('+') > -1}
                             down={sortHeader.indexOf('created') > -1 && sortHeader.indexOf('-') > -1}>
                    Run Test
                </TableHeader>
            ),
            accessor: data => <ViewButton text={'Run'} onClick={() => onRunTest(data)}/>,
            className: css['icon-cell']
        }, {
            id: 'logs',
            Header: () => (
                <TableHeader sortable={false}
                    // padding={text('headerPadding')}
                             up={sortHeader.indexOf('created') > -1 && sortHeader.indexOf('+') > -1}
                             down={sortHeader.indexOf('created') > -1 && sortHeader.indexOf('-') > -1}>
                    Logs
                </TableHeader>
            ),
            accessor: data => (<ViewButton icon={faCloudDownloadAlt}
                                           onClick={() => window.open(`${env.PREDATOR_URL}/jobs/${data.job_id}/runs/${data.report_id}/logs`, '_blank')}/>),
            className: css['icon-cell']
        }, {
            id: 'stop',
            Header: () => (
                <TableHeader sortable={false}
                    // padding={text('headerPadding')}
                             up={sortHeader.indexOf('created') > -1 && sortHeader.indexOf('+') > -1}
                             down={sortHeader.indexOf('created') > -1 && sortHeader.indexOf('-') > -1}>
                    Stop
                </TableHeader>
            ),
            accessor: (data) => {
                const disabled = (data.status !== 'in_progress' && data.status !== 'started');
                return (<ViewButton disabled={disabled} icon={faStopCircle} onClick={() => onStop(data)}/>)
            },
            className: css['icon-cell']

        }
    ];


    // return filter(columns, (column) => columnsNames.includes(column.id))
    return columnsNames.map((name) => {
        const column = columns.find((c) => c.id === name);
        if(!column){
            throw new Error(`column ${name} not found`);
        }
        return column;
    });
};





