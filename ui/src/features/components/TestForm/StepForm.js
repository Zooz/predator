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
import Dropdown from "../../../components/Dropdown/Dropdown.export";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {
    faPlus,
    faMinus
} from '@fortawesome/free-solid-svg-icons'

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
    const onDeleteHeader = (index) => {
        const {onChangeValue} = props;
        const step = cloneDeep(props.step);
        step.headers.splice(index, 1);
        onChangeValue(step, props.index);
    };
    const onAddCapture = () => {
        const {onChangeValue} = props;
        const step = cloneDeep(props.step);
        step.captures.push({});
        onChangeValue(step, props.index);
    };
    const onDeleteCapture = (index) => {
        const {onChangeValue} = props;
        const step = cloneDeep(props.step);
        step.captures.splice(index, 1);
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
                <RectangleAlignChildrenLeft className={style['rectangle-url-row']}>
                    <TitleInput style={{flex: 0, marginRight: '10px'}} width={'120px'} title={'Method'}>
                        <HttpMethodDropdown
                            value={step.method}
                            onChange={(value) => onInputChange('method', value)}
                        />
                    </TitleInput>
                    <TitleInput style={{marginRight: '10px'}} title={'Enter Url'}>
                        <Input value={step.url} onChange={(evt) => {
                            onInputChange('url', evt.target.value)
                        }}/>
                    </TitleInput>
                    <TitleInput style={{marginRight: '10px'}} title={'Before Request'}>
                        <ProcessorsDropDown options={processorsExportedFunctions}
                                            onChange={(value) => onInputChange('beforeRequest', value)}
                                            value={step.beforeRequest}/>
                    </TitleInput>
                    <TitleInput title={'After Response'}>
                        <ProcessorsDropDown options={processorsExportedFunctions}
                                            onChange={(value) => onInputChange('afterResponse', value)}
                                            value={step.afterResponse}/>
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
            <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-evenly'}}>
                <div>
                    <Header text={'Headers'}/>
                    <DynamicKeyValueInput value={step.headers} onAdd={onAddHeader} onDelete={onDeleteHeader}
                                          onChange={onHeaderChange}/>
                </div>
                <div>
                    <Header text={'Captures'}/>
                    <DynamicKeyValueInput value={step.captures} onChange={onCaptureChange} onAdd={onAddCapture}
                                          onDelete={onDeleteCapture} keyHintText={'$.id'} valueHintText={'id'}/>

                </div>
            </div>
            <Header text={'Body'}/>
            <JSONInput
                style={{container: {border: '1px solid #557EFF', borderStyle: 'dashed'}}}
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

const DynamicKeyValueInput = ({value, onChange, onAdd, onDelete, keyHintText, valueHintText}) => {
    const headersList = value
        .map((header, index) => {
            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    width: '100%',
                    marginBottom: index !== headersList - 1 ? '5px' : undefined
                }} key={`${index}.${header.key}.${header.value}`}>
                    <Input style={{marginRight: '10px'}} value={header.key} onChange={(evt) => {
                        onChange('key', evt.target.value, index)
                    }} placeholder={keyHintText || 'key'}/>

                    <Input value={header.value} onChange={(evt) => {
                        onChange('value', evt.target.value, index)
                    }} placeholder={valueHintText || 'value'}/>

                    {
                        (value.length - 1 === index || value.length === 1) &&
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
