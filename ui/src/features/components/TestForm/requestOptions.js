import React from 'react';

import UiSwitcher from '../../../components/UiSwitcher'

const SideLabel = ({label, children}) => {


    return (
        <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
            {children}
            <div style={{fontSize: '13px', color: '#555555', marginLeft: '10px'}}>{label}</div>
        </div>
    )
}
export default (props) => {
    const {gzipValue , foreverValue, onGzipToggleChanged, onForeverToggleChanged} = props;
    return (
        <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'sapce-between', marginLeft: '17px'}}>
            <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
                <SideLabel label={'gzip'}>
                    <UiSwitcher
                        onChange={(value) => {
                            onGzipToggleChanged(value)
                        }}
                        disabledInp={false}
                        activeState={true}
                        height={12}
                        width={22}
                    />
                </SideLabel>
            </div>
            <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
                <SideLabel label={'keep-alive'}>
                    <UiSwitcher
                        onChange={(value) => {
                            onForeverToggleChanged(value)
                        }}
                        disabledInp={false}
                        activeState={!!foreverValue}
                        height={12}
                        width={22}
                    />
                </SideLabel>
            </div>
        </div>

    )
}
