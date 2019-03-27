import React from 'react'
import { storiesOf } from '@storybook/react'
import { action } from '@storybook/addon-actions'
import { text } from '@storybook/addon-knobs'
import { ReactTableComponent, TableHeader } from './../../index'
import smallData from './smallData.mock'
import largeData from './largeData.mock'
import docDecorator from '../../../../.storybook/doc/decorator'
import readme from './Table.md'

const reactTableStories = storiesOf('Table/Table', module)
reactTableStories.addDecorator(docDecorator(readme))

reactTableStories
  .add('No Data', () => (
    <ReactTableComponent
      manual={false}
      data={[]}
      columns={columns('+id')}
      selectRow={selectRow}
      sortEvent={sortEvent}
      showPagination
      cursor={'default'} />
  ))
  .add('Small Data', () => (
    <ReactTableComponent
      manual={false}
      data={smallData}
      columns={columns('+id')}
      selectedRow={text('selected row')}
      cellPadding={text('cellPadding')}
      selectRow={selectRow}
      sortEvent={sortEvent}
      onRowEnter={action('Mouse enter row')}
      onRowLeave={action('Mouse leave row')}
      rowHeight={text('height', '')}
      showPagination
      cursor={'default'} />
  ))
  .add('large Data', () => {
    return (<ReactTableComponent
      manual={false}
      data={largeData}
      pageSize={10}
      numericPagination
      cellPadding={text('cellPadding')}
      columns={columns('+id')}
      selectedRow={text('selected row')}
      selectRow={selectRow}
      sortEvent={sortEvent}
      rowHeight={text('height', '')}
      showPagination
      resizable={false}
      cursor={'default'} />
    )
  })

const selectRow = (selected) => {
  console.log(selected)
}

const sortEvent = (column) => {
  console.log(column)
}

const columns = (sortHeader) => ([
  {
    Header: () => (
      <TableHeader sortable
        padding={text('headerPadding')}
        up={sortHeader.indexOf('id') > -1 && sortHeader.indexOf('+') > -1}
        down={sortHeader.indexOf('id') > -1 && sortHeader.indexOf('-') > -1}>
        Payment ID
      </TableHeader>
    ),
    accessor: 'id'
  },
  {
    Header: () => (
      <TableHeader sortable={false} padding={text('headerPadding')}>
        Business Unit
      </TableHeader>
    ),
    accessor: 'application_id'
  },
  {
    id: 'orderId',
    Header: () => (
      <TableHeader sortable
        padding={text('headerPadding')}
        up={sortHeader.indexOf('orderId') > -1 && sortHeader.indexOf('+') > -1}
        down={sortHeader.indexOf('orderId') > -1 && sortHeader.indexOf('-') > -1}>
        Order Id
      </TableHeader>
    ),
    accessor: d => d.order.id
  },
  {
    id: 'customerEmail',
    Header: () => (
      <TableHeader sortable
        padding={text('headerPadding')}
        up={sortHeader.indexOf('customerEmail') > -1 && sortHeader.indexOf('+') > -1}
        down={sortHeader.indexOf('customerEmail') > -1 && sortHeader.indexOf('-') > -1}>
        Customer Email
      </TableHeader>
    ),
    accessor: d => d.customer.email
  },
  {
    id: 'AmountCurr',
    Header: () => (
      <TableHeader sortable={false} padding={text('headerPadding')}>
        Amount
      </TableHeader>
    ),
    accessor: d => `${d.amount} ${d.currency}`
  },
  {
    Header: () => (
      <TableHeader sortable
        padding={text('headerPadding')}
        up={sortHeader.indexOf('status') > -1 && sortHeader.indexOf('+') > -1}
        down={sortHeader.indexOf('status') > -1 && sortHeader.indexOf('-') > -1}>
        Payment Status
      </TableHeader>
    ),
    accessor: 'status'
  },
  {
    Header: () => (
      <TableHeader sortable
        padding={text('headerPadding')}
        up={sortHeader.indexOf('created') > -1 && sortHeader.indexOf('+') > -1}
        down={sortHeader.indexOf('created') > -1 && sortHeader.indexOf('-') > -1}>
        Date Created
      </TableHeader>
    ),
    accessor: 'created'
  }
])
