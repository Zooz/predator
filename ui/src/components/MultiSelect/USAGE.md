# MultiSelect

### Example

<!-- STORY -->

### Usage

```js
import { MultiSelect } from 'generic-ui-components'

const options = [
  { key: 'key_1', value: 'value_1' },
  { key: 'key_2', value: 'value_2' },
  { key: 'key_3', value: 'value_3' }
];

const startsWithStrategy = ({ array = [], propName, value }) => {
  const lowerCaseValue = value.toLowerCase();
  return array.filter(object => object[propName].toLowerCase().startsWith(lowerCaseValue))
};

const onSelectedOptionsChange = (options) => {
  console.log(options); // OUTPUT: [{ key: 'key_1', value: 'value_1' }]
};

<MultiSelect
    options={options}
    selectedOptions={this.state.selectedOptions}
    onChange={(options) => onSelectedOptionsChange(options)}
    placeholder={"Please select an option"}
    height={'35px'}
    disabled={false}
    maxSize={50}
    validationErrorText=''
    enableFilter={true}
    filteringStrategy={startsWithStrategy}
    enableSelectAll={true}
    selectAllText={'Check All'}
    enableEllipsis={true}
/>

```

Note:<br/>
If a component is used as an option value.
i.e
```js
options=[...{key: 'key1', value: <Component />}]
```
`<Component />` will receive a boolean `isHover` to indicate if hovering the row

### Properties

| propName            | propType         | defaultValue    | isRequired | description                                                                               |
| ------------------- | ---------------- | --------------- | ---------- | ----------------------------------------------------------------------------------------- |
| options             | array of objects | []              | +          |                                                                                           |
| selectedOptions     | array of objects | []              | -          |                                                                                           |
| onChange            | function         | -               | +          |                                                                                           |
| placeholder         | string           | 'Please Select' | -          |                                                                                           |
| height              | string           | '35px'          | -          |                                                                                           |
| disabled            | bool             | false           | -          |                                                                                           |
| maxSize             | number           | 500             | -          | Defines the number of visible options in a drop-down list                                 |
| validationErrorText | string           | ''              | -          |                                                                                           |
| enableFilter        | bool             | true            | -          |                                                                                           |
| filteringStrategy   | function         | StartWith       | -          | Returns the items begin with the characters of a given input                              |
| enableSelectAll     | bool             | false           | -          |                                                                                           |
| selectAllText       | string           | 'Select All'    | -          |                                                                                           |
| enableEllipsis      | bool             | false           | -          | Makes the overflowed content that is not displayed to be displayed in Ellipsis mode (...) |