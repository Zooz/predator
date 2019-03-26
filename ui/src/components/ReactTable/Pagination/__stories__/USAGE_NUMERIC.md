# NumericPagination

### Example

<!-- STORY -->

### Usage

```js
import { NumericPagination } from ''

<NumericPagination
  value={1}
  pages={10}
  onPageChange={() => {}}
  canNext
  canPrevious
/>

```

### Properties


| propName     | propType | defaultValue | isRequired | description |
| ------------ | -------- | ------------ | ---------- | ----------- |
| value        | number   | 0            | -          |             |
| pages        | number   | -            | +          |             |
| onPageChange | function | -            | +          |             |
| previousText | string   | Previous     | -          |             |
| nextText     | string   | Next         | -          |             |
| canNext      | bool     | false        | -          |             |
| canPrevious  | bool     | false        | -          |             |
