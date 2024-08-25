import Dropdown from './Dropdown.export';
import React from 'react';

const CustomDropdown = (props) => {
  const { list, width, onChange, value, placeHolder, style } = props;
  return (
    <Dropdown
      width={width}
      style={style}
      options={list.map((option) => ({ key: option, value: option }))}
      selectedOption={{ key: value, value: value }}
      onChange={(selected) => {
        onChange(selected.value)
      }}
      placeholder={placeHolder}
      height={'35px'}
      disabled={false}
      validationErrorText=''
      enableFilter={false}
    />
  )
}
export default CustomDropdown;
