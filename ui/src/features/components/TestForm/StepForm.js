import React from 'react';

import JSONInput from 'react-json-editor-ajrm';
import locale from 'react-json-editor-ajrm/locale/en';
import RectangleAlignChildrenLeft from '../../../components/RectangleAlign/RectangleAlignChildrenLeft'
import {cloneDeep} from 'lodash'
import RequestOptions from './requestOptions';
import ProcessorsDropDown from './ProcessorsDropDown';

import style from './stepform.scss';
import Input from "../../../components/Input";
import TitleInput from "../../../components/TitleInput";
import Button from "../../../components/Button";
import Dropdown from "../../../components/Dropdown/Dropdown.export";

export default (props) => {
    const sampleObject = {};

    const onHeaderChange = (key, value, index) => {
        const {onChangeValue} = props;
        const step = cloneDeep(props.step);
        step.headers[index][key] = value;
        onChangeValue(step, props.index);
    };

    const onAddHeader = () => {
        const {onChangeValue} = props;
        const step = cloneDeep(props.step);
        step.headers.push({});
        onChangeValue(step, props.index);
    };
    const onAddCapture = () => {
        const {onChangeValue} = props;
        const step = cloneDeep(props.step);
        step.captures.push({});
        onChangeValue(step, props.index);
    };
    const onCaptureChange = (key, value, index) => {
        const {onChangeValue} = props;
        const step = cloneDeep(props.step);
        step.captures[index][key] = value;
        onChangeValue(step, props.index);
    };

    const onBodyChange = (value) => {
        if (!value.error) {
            const {onChangeValue} = props;
            const step = cloneDeep(props.step);
            step.body = value.jsObject;
            onChangeValue(step, props.index);
        }
    };

    const onInputChange = (key, value) => {
        const {onChangeValue} = props;
        const step = cloneDeep(props.step);

        step[key] = value;
        onChangeValue(step, props.index);
    };


    const {
        step, processorsExportedFunctions
    } = props;
    const disableSampleBody = step.method === 'GET';
    const jsonObjectKey = step.method === 'GET' ? 'get' : 'not-get';

    return (
        <div style={{display: 'flex', flexDirection: 'column', width: '100%'}}>
            <div className={style['http-methods-request-options-wrapper']}>
                <RectangleAlignChildrenLeft className={style['rectangle-http-methods']}>
                    <TitleInput title={'Method'}>
                        <HttpMethodDropdown
                            value={step.method}
                            onChange={(value) => onInputChange('method', value)}
                        />
                    </TitleInput>
                    <TitleInput style={{width: '100%'}} title={'Enter Url'}>
                        <Input value={step.url} onChange={(evt) => {
                            onInputChange('url', evt.target.value)
                        }}/>
                    </TitleInput>
                    <RequestOptions
                        onGzipToggleChanged={(value) => onInputChange('gzip', value)}
                        onForeverToggleChanged={(value) => onInputChange('forever', value)}
                        gzipValue={step.gzip}
                        foreverValue={step.forever}
                    />
                </RectangleAlignChildrenLeft>


            </div>
            <RectangleAlignChildrenLeft/>
            <div style={{display:'flex',flexDirection:'row',marginBottom:'22px'}}>
                <div>
                    <Header text={'Headers'}/>
                    <DynamicKeyValueInput value={step.headers} onChange={onHeaderChange}/>
                    <Button style={{width: '100px', minWidth: '0'}} inverted
                            onClick={onAddHeader}>+Add</Button>
                </div>
                <div>
                    <Header text={'Captures'}/>
                    <DynamicKeyValueInput value={step.captures} onChange={onCaptureChange}
                                          keyHintText={'$.id'} valueHintText={'id'}/>
                    <Button style={{width: '100px', minWidth: '0'}} inverted
                            onClick={onAddCapture}>+Add</Button>
                </div>
            </div>
            <Header text={'Processors'}/>
            <div style={{
                display: 'flex',
                flexDirection: 'row',
                width: '100%',
                alignItems: 'center',
                marginBottom: '40px'
            }}>
                <TitleInput title={'Before Request'}>
                    <ProcessorsDropDown options={processorsExportedFunctions}
                                        onChange={(value) => onInputChange('beforeRequest', value)}
                                        value={step.beforeRequest}/>
                </TitleInput>
                <TitleInput title={'After Response'}>
                    <ProcessorsDropDown options={processorsExportedFunctions}
                                        onChange={(value) => onInputChange('afterResponse', value)}
                                        value={step.afterResponse}/>
                </TitleInput>
            </div>
            <Header text={'Body'}/>
            <JSONInput
                key={jsonObjectKey}
                id='a_unique_id'
                placeholder={step.body || (disableSampleBody ? undefined : sampleObject)}
                colors={{
                    default: 'black',
                    background: 'white',
                    string: 'red',
                    keys: 'blue'
                }}
                locale={locale}
                height={'200px'}
                width={'100%'}
                onChange={onBodyChange}
            />
        </div>

    )
}

const DynamicKeyValueInput = ({value, onChange, keyHintText, valueHintText}) => {
    const headersList = value
        .map((header, index) => {
            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    width: '100%',
                    marginBottom: index !== headersList - 1 ? '5px' : undefined
                }} key={index}>
                    <Input style={{marginRight: '10px'}} value={header.key} onChange={(evt) => {
                        onChange('key', evt.target.value, index)
                    }} placeholder={keyHintText || 'key'}/>

                    <Input value={header.value} onChange={(evt) => {
                        onChange('value', evt.target.value, index)
                    }} placeholder={valueHintText || 'value'}/>
                </div>
            )
        });

    return (
        <div style={{display: 'flex', flexDirection: 'column', width: '100%', marginBottom: '10px'}}>
            {headersList}
        </div>
    )
}

const HttpMethodDropdown = (props) => {
    const httpMethods = ['POST', 'GET', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD', 'CONNECT', 'TRACE'];
    const {onChange, value} = props;
    return (
        <Dropdown
            options={httpMethods.map((option) => ({key: option, value: option}))}
            selectedOption={{key: value, value: value}}
            onChange={(selected) => {
                onChange(selected.value)
            }}
            placeholder={"Method"}
            height={'35px'}
            disabled={false}
            validationErrorText=''
            enableFilter={false}
        />
    )
}


const Header = ({text}) => {
    return (
        <div style={{
            // fontFamily: 'Roboto',
            fontSize: '20px',
            fontWeight: '300',
            fontStretch: 'normal',
            fontStyle: 'italic',
            color: '#778195',
            lineHeight: 'normal',
            letterSpacing: 'normal',
            marginBottom: '11px'

        }}>{text}</div>
    )
}
