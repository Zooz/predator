import RadioButton from '../RadioButton';
import React from "react";


const RadioOptions = ({list=[], value, onChange}) => {

    const content = list.map((type, index) => {
        return (
            <RadioButton style={{marginLeft:'5px'}} onClick={() => onChange(type)} selected={value === type} key={index} size={'12px'}
                         label={type}/>
        )
    });

    return (

        <div style={{display: 'flex', alignItems: 'center', flex: 1}}>
            {content}
        </div>
    )


};

export default RadioOptions;
