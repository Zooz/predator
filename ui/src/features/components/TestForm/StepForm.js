import React, {useState} from 'react';

import RectangleAlignChildrenLeft from '../../../components/RectangleAlign/RectangleAlignChildrenLeft'
import {cloneDeep} from 'lodash'
import RequestOptions from './requestOptions';
import ProcessorsDropDown from './ProcessorsDropDown';
import ContentTypeList from './ContentTypeList';
import BodyEditor from './BodyEditor';
import {
    SUPPORTED_CONTENT_TYPES,
    SUPPORTED_CAPTURE_TYPES,
    CONTENT_TYPES,
    CAPTURE_TYPES,
    HTTP_METHODS
} from './constants'

import style from './stepform.scss';
import Input from "../../../components/Input";
import TitleInput from "../../../components/TitleInput";
import DynamicKeyValueInput from './DynamicKeyValueInput';
import CustomDropdown from './CustomDropdown';

export default (props) => {

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
        step.captures.push({type: step.captures[step.captures.length - 1].type || CAPTURE_TYPES.JSON_PATH});
        onChangeValue(step, props.index);
    };
    const onDeleteCapture = (index) => {
        const {onChangeValue} = props;
        const step = cloneDeep(props.step);
        step.captures.splice(index, 1);
        onChangeValue(step, props.index);
    };
    const onChangeCaptureType = (value, index) => {
        const {onChangeValue} = props;
        const step = cloneDeep(props.step);
        step.captures[index].type = value;
        onChangeValue(step, props.index);
    };
    const onCaptureChange = (key, value, index) => {
        const {onChangeValue} = props;
        const step = cloneDeep(props.step);
        step.captures[index][key] = value;
        onChangeValue(step, props.index);
    };

    const onBodyChange = (editorType, value) => {
        if (editorType === CONTENT_TYPES.APPLICATION_JSON && value.error) {
            return; //error in json parsing
        }
        const content = editorType === CONTENT_TYPES.APPLICATION_JSON ? value.jsObject : value;
        const {onChangeValue} = props;
        const step = cloneDeep(props.step);
        step.body = content;
        onChangeValue(step, props.index);
    };

    const onInputChange = (newProps) => {
        const {onChangeValue} = props;
        const step = Object.assign(cloneDeep(props.step), newProps);
        onChangeValue(step, props.index);
    };

    const onChangeContentType = (value) => {
        const step = cloneDeep(props.step);
        let body = step.body;
        if (value === CONTENT_TYPES.APPLICATION_JSON) {
            if (typeof step.body !== 'object') {
                try {
                    body = JSON.parse(step.body)
                } catch (err) {
                    body = undefined;
                }
            }
        }
        const {onChangeValue} = props;
        step.contentType = value;
        step.body = body;
        onChangeValue(step, props.index);
    };

    const {
        step, processorsExportedFunctions
    } = props;
    const jsonObjectKey = step.method === 'GET' ? 'get' : 'not-get';

    return (
        <div style={{display: 'flex', flexDirection: 'column', width: '100%'}}>
            <div className={style['http-methods-request-options-wrapper']}>
                <RectangleAlignChildrenLeft className={style['rectangle-url-row']}>
                    <TitleInput style={{flex: 0, marginRight: '10px'}} width={'120px'} title={'Method'}>
                        <CustomDropdown
                            list={HTTP_METHODS}
                            value={step.method}
                            onChange={(value) => {
                                onInputChange({method: value, contentType: CONTENT_TYPES.NONE});
                            }}
                            placeHolder={'Method'}
                        />
                    </TitleInput>
                    <TitleInput style={{marginRight: '10px', flexGrow: 2}} title={'Url'}>
                        <Input value={step.url} onChange={(evt) => {
                            onInputChange({url: evt.target.value})
                        }}/>
                    </TitleInput>
                    <TitleInput style={{marginRight: '10px'}} title={'Before Request'}>
                        <ProcessorsDropDown options={processorsExportedFunctions}
                                            onChange={(value) => onInputChange({beforeRequest: value})}
                                            value={step.beforeRequest}/>
                    </TitleInput>
                    <TitleInput title={'After Response'}>
                        <ProcessorsDropDown options={processorsExportedFunctions}
                                            onChange={(value) => onInputChange({afterResponse: value})}
                                            value={step.afterResponse}/>
                    </TitleInput>
                    <RequestOptions
                        onGzipToggleChanged={(value) => onInputChange({gzip: value})}
                        onForeverToggleChanged={(value) => onInputChange({forever: value})}
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
                                          onDelete={onDeleteCapture}
                                          keyHintText={'$.id'}
                                          valueHintText={'id'}
                                          dropdownOptions={SUPPORTED_CAPTURE_TYPES}
                                          dropDownPlaceHolder={'Type'}
                                          dropDownOnChange={onChangeCaptureType}
                    />

                </div>
            </div>
            <RectangleAlignChildrenLeft style={{alignItems: 'center', marginBottom: '11px'}}>
                <Header text={'Body'} style={{marginBottom: 0, marginRight: '5px'}}/>
                <ContentTypeList value={step.contentType} list={SUPPORTED_CONTENT_TYPES}
                                 onChange={onChangeContentType}/>
            </RectangleAlignChildrenLeft>
            <BodyEditor type={step.contentType} content={step.body} key={jsonObjectKey} onChange={onBodyChange}/>
        </div>

    )
}


const Header = ({text, style = {}}) => {
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
            marginBottom: '11px',
            ...style
        }}>{text}</div>
    )
}
