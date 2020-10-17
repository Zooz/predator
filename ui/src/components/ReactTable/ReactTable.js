import React from 'react'
import PropTypes from 'prop-types'
import ReactTable from 'react-table'
import { isEqual } from 'lodash'
import classnames from 'classnames'
import PaginationComponent from './Pagination'
import css from './style/table-style.scss'
import 'react-table/react-table.css'
import NumericPagination from './NumericPagination/NumericPagination'
import SearchBar from '../SearchBar'

export default class ReactTableComponent extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            selectedRow: null,
            sortByColumn: props.sortByColumn,
            sortDir: props.sortDir
        }
    }

    componentDidUpdate(prevProps) {
        if (!isEqual(prevProps.data, this.props.data) && this.state.selectedRow && !this.props.selectedRow) {
            this.setState({
                selectedRow: null
            })
        }
    }

    static getDerivedStateFromProps = (nextProps, prevState) => {
        if (nextProps.selectedRow !== undefined) {
            return ({
                ...prevState,
                selectedRow: nextProps.selectedRow
            })
        } else {
            return null
        }
    }

    render() {
        const {
            data,
            noDataText,
            columns,
            loading,
            selectRow,
            sortEvent,
            sortByColumn,
            sortDir,
            showPagination,
            resizable,
            pages,
            onPageChange,
            pageSize,
            page,
            manual,
            totalDataCount,
            className,
            bodyProps,
            cursor,
            colors,
            numericPagination,
            tableRowId,
            rowHeight,
            onRowEnter,
            onRowLeave,
            cellPadding,
            onSearch,
            tdStyle,
            style: customStyle,
            searchSections,
        } = this.props
        const backgroundColors = Object.assign({}, ReactTableComponent.defaultProps.colors.background, colors.background)
        const textColors = Object.assign({}, ReactTableComponent.defaultProps.colors.text, colors.text)
        const headerColors = Object.assign({}, ReactTableComponent.defaultProps.colors.header, colors.header)

        return (
            <div style={customStyle}>
                {onSearch && <SearchBar searchSections={searchSections} onSearch={onSearch} />}
                <ReactTable
                    data={data}
                    className={classnames(css['table'], className, '-striped', '-highlight')}
                    columns={columns}
                    loading={loading}
                    pages={pages}
                    page={page}
                    manual={manual}
                    onPageChange={onPageChange}
                    showPagination={showPagination}
                    sortable={false}
                    PaginationComponent={numericPagination ? NumericPagination : PaginationComponent}
                    pageSize={pageSize}
                    resizable={resizable}
                    minRows={data.length ? pageSize || 0 : 5}
                    totalDataCount={totalDataCount}
                    noDataText={noDataText || 'There is no data'}
                    getTheadProps={() => ({
                        style: { '--header-color': headerColors.default },
                        className: css['thead']
                    })}
                    getTbodyProps={() => ({ ...bodyProps, className: css['tbody'] })}
                    getTheadThProps={(state, rowInfo, column, instance) => ({
                        className: css['th'],
                        style: { '--cursor': cursor },
                        onClick: e => {
                            if (sortEvent) {
                                sortEvent(column.id)
                                this.setState({
                                    sortByColumn: column.id,
                                    sortDir: sortDir === '-' && sortByColumn === column.id ? '+' : '-'
                                })
                            }
                        }
                    })}
                    getTdProps={() => ({
                        className: [css['td'], !rowHeight && css['td--autoheight']].join(' '),
                        style: {
                            '--row-height': rowHeight,
                            '--cell-side-padding': cellPadding,
                            ...tdStyle
                        }
                    })}
                    getTrGroupProps={() => ({
                        className: css['tr-group']
                    })}
                    getTrProps={(state, rowInfo, column, instance) => {
                        if (!rowInfo) return false
                        const isSelected = rowInfo.row[tableRowId] === this.state.selectedRow
                        return {
                            onClick: e => {
                                if (selectRow) {
                                    this.setState({
                                        selectedRow: rowInfo.row[tableRowId] === this.state.selectedRow ? null : rowInfo.row[tableRowId]
                                    })
                                    selectRow(rowInfo.row[tableRowId] === this.state.selectedRow ? null : rowInfo.row[tableRowId])
                                }
                            },
                            className: classnames(css['tr'], {
                                [css['tr--autoheight']]: !rowHeight,
                                [css['tr--selected']]: isSelected
                            }),
                            onMouseEnter: onRowEnter ? () => onRowEnter(rowInfo.row) : undefined,
                            onMouseLeave: onRowLeave ? () => onRowLeave(rowInfo.row) : undefined,
                            style: {
                                '--cursor': cursor,
                                '--row-height': rowHeight,
                                '--background-default': backgroundColors.default,
                                '--background-selected': backgroundColors.selected,
                                '--text-default': textColors.default,
                                '--text-selected': textColors.selected
                            }
                        }
                    }} />
            </div>
        )
    }
}

ReactTableComponent.propTypes = {
    data: PropTypes.array,
    columns: PropTypes.array,
    loading: PropTypes.bool,
    manual: PropTypes.bool,
    pageSize: PropTypes.number,
    totalDataCount: PropTypes.number,
    onRowEnter: PropTypes.func,
    onRowLeave: PropTypes.func,
    selectRow: PropTypes.func,
    selectedRow: PropTypes.any,
    sortEvent: PropTypes.func,
    onPageChange: PropTypes.func,
    sortByColumn: PropTypes.string,
    className: PropTypes.string,
    showPagination: PropTypes.bool,
    pages: PropTypes.number,
    page: PropTypes.number,
    resizable: PropTypes.bool,
    sortDir: PropTypes.string,
    bodyProps: PropTypes.object,
    cursor: PropTypes.string,
    cellPadding: PropTypes.string,
    tableRowId: PropTypes.string,
    rowHeight: PropTypes.string,
    colors: PropTypes.shape({
        background: PropTypes.shape({
            default: PropTypes.string,
            selected: PropTypes.string
        }),
        text: PropTypes.shape({
            default: PropTypes.string,
            selected: PropTypes.string
        }),
        header: PropTypes.shape({
            default: PropTypes.string
        })
    })

}

ReactTableComponent.defaultProps = {
    data: [],
    selectedRow: undefined,
    pageSize: undefined,
    manual: true, // change to false
    columns: [],
    bodyProps: {},
    sortByColumn: 'created',
    sortDir: '-',
    showPagination: true,
    pages: undefined,
    cursor: 'pointer',
    page: undefined,
    totalDataCount: undefined, // only needed for manual and pagination
    resizable: true,
    tableRowId: 'id',
    rowHeight: null,
    cellPadding: '8px',
    colors: {
        background: {
            default: '#fff',
            selected: '#108ee9'
        },
        text: {
            default: '#000',
            selected: '#fff'
        },
        header: {
            default: '#108ee9'
        }
    }
}
