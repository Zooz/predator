import React from "react";

const RadioButton = ({onClick, style = {}, selected, label, size}) => {

    return (
        <div onClick={onClick} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            ...style
        }}>
            <div style={{
                width: size,
                height: size,
                border: '1px solid rgb(85, 126, 255)',
                backgroundColor: selected && '#557eff',
                borderRadius: '50%',
                marginRight: '2px',
            }}/>
            <div>{label}</div>
        </div>

    )

};


export default RadioButton
