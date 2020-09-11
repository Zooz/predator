import React, {useState} from "react";

const statusToColor = {
    'UP': 'green',
    'DOWN': 'red',
    'N/A': 'grey',
    'SERVICE_DEPENDENCIES': '#dde02f'
};

const headerFontStyle = {
    color: '#557eff',
    fontWeight: 'bold',
};


const SimpleTable = ({style,headers=[], rows=[]}) => {

    return (
        <div style={{borderRadius: '25px',...style}}>
            <div style={{
                ...headerFontStyle,
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between'
            }}>
                {
                    headers.map((header,index) => <div key={index}>{header}</div>)
                }
            </div>
            {
                rows.map((rowContent, index) => {
                    return (<Row key={index} rowContent={rowContent}/>)
                })
            }
        </div>
    )
};

const SideHeader = ({title, children, style = {}}) => {
    return (
        <div style={{display: 'flex', marginBottom: '5px', flexDirection: 'column', ...style}}>
            <div style={{...headerFontStyle}}>{title}</div>
            {children}
        </div>
    )
}

const Row = ({rowContent=[]}) => {
    return (
        <div style={rowStyle}>
            <div style={{cursor: 'pointer', ...rowContentStyle}}>
                {
                    rowContent.map((content) => <div>{content}</div>)
                }
            </div>
        </div>

    )
};
const rowContentStyle = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 1
};
const rowStyle = {
    minHeight: '25px', display: 'flex',
    flexDirection: 'column',
    borderBottom: '1px solid #E9E9E9',
    color: '#778294',
    fontFamily: 'poppins, sans-serif',
    paddingTop: '5px',
    paddingBottom: '5px',
};

const tdStyle = {
    width: '70px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
};


export default SimpleTable;
