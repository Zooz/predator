import React from "react";

const headerFontStyle = {
    color: '#557eff',
    fontWeight: 'bold',
};


const SimpleTable = ({style, headers = [], rows = [], disableSeparator}) => {

    return (
        <div style={{borderRadius: '25px', ...style}}>
            <div style={{
                ...headerFontStyle,
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between'
            }}>
                {
                    headers.map((header, index) => <div key={index}>{header}</div>)
                }
            </div>
            {
                rows.map((rowContent, index) => {
                    return (<Row disableSeparator={disableSeparator} key={index} rowContent={rowContent}/>)
                })
            }
        </div>
    )
};

const Row = ({disableSeparator, rowContent = []}) => {
    const rowStyle = {
        minHeight: '25px', display: 'flex',
        flexDirection: 'column',
        borderBottom: !disableSeparator && '1px solid #E9E9E9',
        color: '#778294',
        fontFamily: 'poppins, sans-serif',
        paddingTop: '5px',
        paddingBottom: '5px',
    };

    return (
        <div style={rowStyle}>
            <div style={{...rowContentStyle}}>
                {
                    rowContent.map((content, index) => <div key={index}>{content}</div>)
                }
            </div>
        </div>

    )
};
const rowContentStyle = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 1
};


const tdStyle = {
    width: '70px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
};


export default SimpleTable;
