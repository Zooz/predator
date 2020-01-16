import DropDownMenu from "material-ui/DropDownMenu";
import MenuItem from "material-ui/MenuItem";
import React from "react";

const ProcessorsDropdown = ({onChange, options=[], value, loading}) => {
    const dropDownOptions = [...options, {name: loading ? 'Loading...' : 'NONE', id: undefined}];
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
