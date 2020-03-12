import React from "react";
import Dropdown from "../../../components/Dropdown/Dropdown.export";
const ProcessorsDropdown = ({onChange, options = [], value, loading}) => {
    let dropDownOptions = [...options, {name: loading ? 'Loading...' : 'NONE', id: undefined}];
    let curValue;
    if (value) {
        const isValueExistInOptions = options.find(option => option.id === value);
        if (!isValueExistInOptions) {
            dropDownOptions = [{id: value, name: value}].concat(dropDownOptions);
            curValue={key:value,name:value}

        }else{
            curValue={key:isValueExistInOptions.id,value:isValueExistInOptions.name}
        }
    }



    const startsWithStrategy = ({ array = [], propName, value }) => {
        const lowerCaseValue = value.toLowerCase();
        return array.filter(object => object[propName].toLowerCase().startsWith(lowerCaseValue))
    }

    const onSelectedOptionChange = (option) => {
        onChange(option.key)
    }

   return( <Dropdown
        options={dropDownOptions.map((option) => ({key: option.id, value: option.name}))}
        selectedOption={curValue}
        onChange={(options) => onSelectedOptionChange(options)}
        placeholder={"Select Processor"}
        height={'35px'}
        disabled={false}
        validationErrorText=''
        enableFilter={true}
        filteringStrategy={startsWithStrategy}
    />)
};
export default ProcessorsDropdown;
