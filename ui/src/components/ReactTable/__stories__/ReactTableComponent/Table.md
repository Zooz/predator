# SearchResults

### Example

<!-- STORY -->

### Usage

```js
import { ReactTableComponent, TableHeader } from 'generic-ui-components'

const columns = [
  {
    Header: () => (
      <TableHeader sortable
        padding={text('headerPadding')}
        up
        down={false}>
        Payment ID
      </TableHeader>
    ),
    accessor: 'id'
  },
  {
    Header: () => (
      <TableHeader sortable={false}>
        Business Unit
      </TableHeader>
    ),
    accessor: 'application_id'
  }
]

<ReactTableComponent
  manual={false}
  data={[]}
  columns={columns}
  showPagination />
```

### Properties


| propName       | propType  | defaultValue                                                                                                                        | isRequired | description                                                                                                                |
| -------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------- |
| data           | [objects] | []                                                                                                                                  | -          |                                                                                                                            |
| columns        | [objects] | []                                                                                                                                  | -          |                                                                                                                            |
| loading        | bool      | false                                                                                                                               | -          |                                                                                                                            |
| manual         | bool      | true                                                                                                                                | -          |                                                                                                                            |
| showPagination | bool      | true                                                                                                                                | -          |                                                                                                                            |
| totalDataCount | number    | -                                                                                                                                   | -          | only needed for manual and pagination                                                                                      |
| pageSize       | number    | -                                                                                                                                   | -          |                                                                                                                            |
| pages          | number    | -                                                                                                                                   | -          |                                                                                                                            |
| resizable      | bool      | true                                                                                                                                | -          |                                                                                                                            |
| page           | number    | -                                                                                                                                   | -          |                                                                                                                            |
| onPageChange   | function  | -                                                                                                                                   | -          |                                                                                                                            |
| onRowEnter     | function  | -                                                                                                                                   | -          |                                                                                                                            |
| onRowLeave     | function  | -                                                                                                                                   | -          |                                                                                                                            |
| selectRow      | function  | -                                                                                                                                   | -          |                                                                                                                            |
| sortEvent      | function  | -                                                                                                                                   | -          |                                                                                                                            |
| sortByColumn   | string    | created                                                                                                                             | -          |                                                                                                                            |
| sortDir        | string    | '-'                                                                                                                                 | -          |                                                                                                                            |
| selectRow      | function  | -                                                                                                                                   | -          |                                                                                                                            |
| selectedRow    | any       | -                                                                                                                                   | -          |                                                                                                                            |
| className      | string    | -                                                                                                                                   | -          |                                                                                                                            |
| cursor         | string    | pointer                                                                                                                             | -          |                                                                                                                            |
| cellPadding    | string    | 12px                                                                                                                                | -          |                                                                                                                            |
| tableRowId     | string    | id                                                                                                                                  | -          |                                                                                                                            |
| rowHeight      | string    | -                                                                                                                                   | -          |                                                                                                                            |
| bodyProps      | object    | -                                                                                                                                   | -          |                                                                                                                            |
| colors         | object    | { background: { default: '#fff', selected: '#108ee9' }, text: { default: '#000', selected: '#fff' }, header: { default: '#108ee9' } | -          | background: { default: string,  selected: string }, text: {default: string, selected: string }, header: { default: string} |

