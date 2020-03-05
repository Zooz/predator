import DropDownMenu from "material-ui/DropDownMenu";
import MenuItem from "material-ui/MenuItem";
import React from "react";
import Dropdown from "../../../components/Dropdown/Dropdown.export";
const ProcessorsDropdown = ({onChange, options = [], value, loading}) => {
    console.log("value",value)
    let dropDownOptions = [...options, {name: loading ? 'Loading...' : 'NONE', id: undefined}];
    let curValue;
    if (value) {
        const isValueExistInOptions = options.find(option => option.id === value);
        console.log("isValueExistInOptions",isValueExistInOptions)
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
        console.log(option); // OUTPUT: { key: 'key_1', value: 'value_1' }

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
    return (
        <DropDownMenu
            autoWidth={false}
            style={{width: '100%', height: '50px'}}
            value={value}
            onChange={(event, keyNumber, value) => {
                onChange(value)
            }}
        >
            {
                dropDownOptions.map((option, index) => {
                    return (<MenuItem key={index} value={option.id} primaryText={option.name}/>
                    )
                })
            }
        </DropDownMenu>
    )
};
export default ProcessorsDropdown;
