# NumericInput

### Example

<!-- STORY -->

### Usage

```js
import { NumericInput } from 'generic-ui-components'

<NumericInput
  maxValue={5}
  minValue={-2}
  onChange={() => {}}
  disabled={false}
  hideNumber={false}
  error={false}
  height={'26px'}
  width={'56px'}
  formatter={(value) => `${value}%`}
/>


```

### Properties

| propName    | propType         | defaultValue | isRequired | description |
| ----------- | ---------------- | ------------ | ---------- | ----------- |
| value       | number           | -            | -          |             |
| maxValue    | MAX_SAFE_INTEGER | -            | -          |             |
| minValue    | 0                | -            | -          |             |
| onChange    | function         | -            | +          |             |
| onUpPress   | function         | -            | -          |             |
| onDownPress | function         | -            | -          |             |
| formatter   | function         | -            | -          |             |
| disabled    | bool             | false        | -          |             |
| error       | bool             | false        | -          |             |
| hideNumber  | bool             | false        | -          |             |
| width       | string           | 56px         | -          |             |
| height      | string           | 26px         | -          |             |
| className   | string           | -            | -          |             |
