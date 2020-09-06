import Input from "../../../components/Input";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faMinus, faPlus} from "@fortawesome/free-solid-svg-icons";
import React from "react";
import CustomDropdown from './CustomDropdown';

const DynamicKeyValueInput = ({value, onChange, onAdd, onDelete, keyHintText, valueHintText, dropdownOptions, dropDownOnChange, dropDownPlaceHolder}) => {
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
                            style={{marginRight:'10px'}}
                            list={dropdownOptions}
                            value={keyValuePair.type}
                            onChange={(value) => dropDownOnChange(value, index)}
                            placeHolder={dropDownPlaceHolder}
                        />
                 }
                    <Input style={{marginRight: '10px'}} value={keyValuePair.key} onChange={(evt) => {
                        onChange('key', evt.target.value, index)
                    }} placeholder={keyHintText || 'key'}/>

                    <Input value={keyValuePair.value} onChange={(evt) => {
                        onChange('value', evt.target.value, index)
                    }} placeholder={valueHintText || 'value'}/>

                    {
                        value.length - 1 === index &&
                        <FontAwesomeIcon
                            style={{alignSelf: 'center', color: '#557EFF', cursor: 'pointer', marginLeft: '10px'}}
                            onClick={() => onAdd(index)}
                            icon={faPlus}/>
                        ||
                        (index < value.length - 1 && <FontAwesomeIcon
                            style={{alignSelf: 'center', color: '#557EFF', cursor: 'pointer', marginLeft: '10px'}}
                            onClick={() => onDelete(index)}
                            icon={faMinus}/>)
                    }
                </div>
            )
        });

    return (
        <div style={{display: 'flex', flexDirection: 'column', width: '100%', marginBottom: '10px'}}>
            {headersList}
        </div>
    )
}


export default DynamicKeyValueInput;
