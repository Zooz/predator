import React from 'react';

import RectangleAlignChildrenLeft from '../../../components/RectangleAlign/RectangleAlignChildrenLeft'
import {cloneDeep} from 'lodash'

import style from './stepform.scss';
import Input from "../../../components/Input";
import TitleInput from "../../../components/TitleInput";

export default (props) => {
    const onInputChange = (key, value) => {
        const {onChangeValue} = props;
        const step = cloneDeep(props.step);
        if(Number.isInteger(Number(value))){
            step[key] = value;
            onChangeValue(step, props.index);
        }
    };


    const {
        step
    } = props;

    return (
        <div style={{display: 'flex', flexDirection: 'column', width: '100%'}}>
            <div className={style['http-methods-request-options-wrapper']}>
                <RectangleAlignChildrenLeft className={style['rectangle-http-methods']}>

                    <TitleInput style={{width: '100%'}} title={'Enter sleep in seconds'}>
                        <Input value={step.sleep} onChange={(evt) => {
                            onInputChange('sleep', evt.target.value)
                        }}/>
                    </TitleInput>

                </RectangleAlignChildrenLeft>
            </div>
        </div>

    )
}

