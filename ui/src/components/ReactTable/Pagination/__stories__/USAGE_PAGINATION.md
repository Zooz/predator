# NumericPagination

### Example

<!-- STORY -->

### Usage

```js
import { Pagination } from 'generic-ui-components'

<Pagination
  canNext
  canPrevious
  onPageChange={() => {}}
  page={1}
  pages={2}
  pageSize={5}
  totalDataCount={10}
/>

```

### Properties


| propName       | propType | defaultValue | isRequired | description |
| -------------- | -------- | ------------ | ---------- | ----------- |
| pages          | number   | -            | -          |             |
| page           | number   | -            | -          |             |
| pageSize       | number   | -            | -          |             |
| totalDataCount | number   | -            | -          |             |
| onPageChange   | function | -            | -          |             |
| previousText   | string   | Previous     | -          |             |
| canNext        | bool     | true         | -          |             |
| canPrevious    | bool     | true         | -          |             |
| data           | array    | []           | -          |             |
