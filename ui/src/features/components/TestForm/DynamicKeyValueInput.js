import Input from '../../../components/Input';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';
import React from 'react';
import CustomDropdown from '../../../components/Dropdown/CustomDropdown';

const DynamicKeyValueInput = ({ value, onChange, onAdd, onDelete, keyHintText, valueHintText, dropdownOptions, dropDownOnChange, dropDownPlaceHolder }) => {
  const headersList = value
    .map((keyValuePair, index) => {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          width: '100%',
          marginBottom: index !== headersList - 1 ? '5px' : undefined
        }} key={index}>
          {dropdownOptions &&
          <CustomDropdown
            width={'125px'}
            style={{ marginRight: '10px' }}
            list={dropdownOptions}
            value={keyValuePair.type}
            onChange={(value) => dropDownOnChange(value, index)}
            placeHolder={dropDownPlaceHolder}
          />
          }
          {
            (!keyValuePair.onlyValue) &&
            <Input style={{ marginRight: '10px' }} value={keyValuePair.key} onChange={(evt) => {
              onChange('key', evt.target.value, index)
            }} placeholder={keyValuePair.keyPlaceholder || keyHintText || 'key'} />

          }

          <Input value={keyValuePair.value} onChange={(evt) => {
            onChange('value', evt.target.value, index)
          }} placeholder={keyValuePair.valuePlaceholder || valueHintText || 'value'} />

          <FontAwesomeIcon
            style={{ alignSelf: 'center', color: '#557EFF', cursor: 'pointer', marginLeft: '10px' }}
            onClick={() => onDelete(index)}
            icon={faMinus} />
        </div>
      )
    });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', marginBottom: '10px' }}>
      {headersList}
      <FontAwesomeIcon
        style={{ alignSelf: 'flex-end', color: '#557EFF', cursor: 'pointer', marginLeft: '10px' }}
        onClick={() => onAdd()}
        icon={faPlus} />
    </div>
  )
}

export default DynamicKeyValueInput;
