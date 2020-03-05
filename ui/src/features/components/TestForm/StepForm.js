import React from 'react';

import JSONInput from 'react-json-editor-ajrm';
import locale from 'react-json-editor-ajrm/locale/en';
import RectangleAlignChildrenLeft from '../../../components/RectangleAlign/RectangleAlignChildrenLeft'
import TextField from 'material-ui/TextField';
import FloatingActionButton from 'material-ui/FloatingActionButton';
import ContentAdd from 'material-ui/svg-icons/content/add';
import DropDownMenu from 'material-ui/DropDownMenu';
import MenuItem from 'material-ui/MenuItem';
import {cloneDeep} from 'lodash'
import RequestOptions from './requestOptions';
import ProcessorsDropDown from './ProcessorsDropDown';

import style from './stepform.scss';
import TextArea from "../../../components/TextArea";
import Input from "../../../components/Input";
import TitleInput from "../../../components/TitleInput";
import Button from "../../../components/Button";

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
                    <TitleInput title={'Select'}>

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
                </RectangleAlignChildrenLeft>

                <RequestOptions
                    onGzipToggleChanged={(value) => onInputChange('gzip', value)}
                    onForeverToggleChanged={(value) => onInputChange('forever', value)}
                    gzipValue={step.gzip}
                    foreverValue={step.forever}
                />
            </div>
            <RectangleAlignChildrenLeft/>
            <Header text={'Headers'}/>
            <DynamicKeyValueInput value={step.headers} onChange={onHeaderChange}/>
            <Button style={{width: '100px', minWidth: '0', marginBottom: '40px'}} inverted
                    onClick={onAddHeader}>+Add</Button>
            <Header text={'Captures'}/>
            <DynamicKeyValueInput value={step.captures} onChange={onCaptureChange}
                                  keyHintText={'$.id'} valueHintText={'id'}/>
            <Button style={{width: '100px', minWidth: '0', marginBottom: '40px'}} inverted
                    onClick={onAddCapture}>+Add</Button>
            <Header text={'Processors'}/>
            <div style={{
                display: 'flex',
                flexDirection: 'row',
                width: '100%',
                paddingLeft: '90px',
                alignItems: 'center',
                marginBottom: '40px'
            }}>
                <div style={{whiteSpace: 'nowrap'}}>Before Request</div>
                <ProcessorsDropDown options={processorsExportedFunctions}
                                    onChange={(value) => onInputChange('beforeRequest', value)}
                                    value={step.beforeRequest}/>
                <div style={{whiteSpace: 'nowrap'}}>After Response</div>
                <ProcessorsDropDown options={processorsExportedFunctions}
                                    onChange={(value) => onInputChange('afterResponse', value)}
                                    value={step.afterResponse}/>
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
                <div style={{display: 'flex', flexDirection: 'row', width: '100%',marginBottom: index!==headersList-1 ? '5px': undefined}} key={index}>
                    <Input style={{marginRight:'10px'}} value={header.key} onChange={(evt) => {
                        onChange('key', evt.target.value, index)
                    }} placeholder={keyHintText || 'key'}/>

                    <Input value={header.value} onChange={(evt) => {
                        onChange('value', evt.target.value, index)
                    }} placeholder={valueHintText || 'value'}/>
                </div>
            )
        });

    return (
        <div style={{display: 'flex', flexDirection: 'column', width: '100%', marginBottom: '22px'}}>
            {headersList}
        </div>
    )
}

const HttpMethodDropdown = (props) => {
    const httpMethods = ['POST', 'GET', 'PUT', 'PATCH', 'DELETE'];
    const {onChange, value} = props;
    return (<DropDownMenu
        autoWidth={false}
        style={{width: '150px', marginLeft: '-25px', height: '50px'}}
        value={value}
        onChange={(event, keyNumber, value) => {
            onChange(value)
        }}
    >
        {
            httpMethods.map((method, index) => {
                return (<MenuItem key={index} value={method} primaryText={method}/>
                )
            })
        }
    </DropDownMenu>);
}


const Header = ({text}) => {
    return (
        <div style={{
            fontFamily: 'Roboto',
            fontSize: '20px',
            fontWeight: '300',
            fontStretch: 'normal',
            fontStyle: 'italic',
            color: '#778195',
            lineHeight: 'normal',
            letterSpacing: 'normal',
            // width: 72px;
            // height: 24px;
            // font-family: Roboto;
            // font-size: 20px;
            // font-weight: 300;
            // font-stretch: normal;
            // font-style: italic;
            // line-height: normal;
            // letter-spacing: normal;
            // color: #778195;
            marginBottom: '11px'

        }}>{text}</div>
    )
}
