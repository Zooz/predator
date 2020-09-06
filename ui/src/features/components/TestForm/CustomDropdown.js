import Dropdown from "../../../components/Dropdown/Dropdown.export";
import React from "react";


const CustomDropdown = (props) => {
    const {list, onChange, value, placeHolder, style} = props;
    return (
        <Dropdown
            style={style}
            options={list.map((option) => ({key: option, value: option}))}
            selectedOption={{key: value, value: value}}
            onChange={(selected) => {
                console.log("selected", selected)
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
