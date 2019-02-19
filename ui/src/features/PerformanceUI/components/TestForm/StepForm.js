
import React from 'react';

import JSONInput from 'react-json-editor-ajrm';
import locale from 'react-json-editor-ajrm/locale/en';
import RectangleAlignChildrenLeft from '../../../../components/RectangleAlign/RectangleAlignChildrenLeft'
import TextField from 'material-ui/TextField';
import FloatingActionButton from 'material-ui/FloatingActionButton';
import ContentAdd from 'material-ui/svg-icons/content/add';
import DropDownMenu from 'material-ui/DropDownMenu';
import MenuItem from 'material-ui/MenuItem';
import { cloneDeep } from 'lodash'
import RequestOptions from './requestOptions';

import style from './stepform.scss';
export default (props) => {
  const sampleObject = {
    'currency': 'USD',
    'amount': 5
  };

  const onHeaderChange = (key, value, index) => {
    const { onChangeValue } = props;
    const step = cloneDeep(props.step);
    step.headers[index][key] = value;
    onChangeValue(step)
  };

  const onAddHeader = () => {
    const { onChangeValue } = props;
    const step = cloneDeep(props.step);
    step.headers.push({});
    onChangeValue(step)
  };
  const onAddCapture = () => {
    const { onChangeValue } = props;
    const step = cloneDeep(props.step);
    step.captures.push({});
    onChangeValue(step)
  };
  const onCaptureChange = (key, value, index) => {
    const { onChangeValue } = props;
    const step = cloneDeep(props.step);
    step.captures[index][key] = value;
    onChangeValue(step)
  };

  const onBodyChange = (value) => {
    if (!value.error) {
      const { onChangeValue } = props;
      const step = cloneDeep(props.step);
      step.body = value.jsObject;
      onChangeValue(step)
    }
  };

  const onInputChange = (key, value) => {
    const { onChangeValue } = props;
    const step = cloneDeep(props.step);

    step[key] = value;
    onChangeValue(step);
  };

  const { step, editMode } = props;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      <div className={style['http-methods-request-options-wrapper']}>
        <RectangleAlignChildrenLeft className={style['rectangle-http-methods']}>
          <HttpMethodDropdown
            value={step.method}
            onChange={(value) => onInputChange('method', value)}
          />
          <TextField value={step.url} style={{ marginBottom: '-19px', width: '100%' }} hintText={'Enter url'} onChange={(event, value) => { onInputChange('url', value) }} />
        </RectangleAlignChildrenLeft>
        <RequestOptions
          onGzipToggleChanged={(value) => onInputChange('gzip', value)}
          onForeverToggleChanged={(value) => onInputChange('forever', value)}
          gzipValue={step.gzip}
          foreverValue={step.forever}
        />
      </div>
      <RectangleAlignChildrenLeft />

            Headers:
      <DynamicKeyValueInput value={step.headers} onAdd={onAddHeader} onChange={onHeaderChange} />
            Captures:
      <DynamicKeyValueInput value={step.captures} onAdd={onAddCapture} onChange={onCaptureChange} keyHintText={'$.id'} valueHintText={'id'} />
              Body:
      <JSONInput
        id='a_unique_id'
        placeholder={step.body || (editMode ? {} : sampleObject)}
        colors={{
          default: 'black',
          background: 'white',
          string: 'red',
          keys: 'blue' }}
        locale={locale}
        height={'200px'}
        width={'100%'}
        onChange={onBodyChange}
      />
    </div>

  )
}

const DynamicKeyValueInput = ({ value, onChange, onAdd, keyHintText, valueHintText }) => {
  const headersList = value
    .map((header, index) => {
      return (
        <div style={{ display: 'flex', flexDirection: 'row', width: '100%' }} key={index}>
          <TextField onChange={(event, value) => { onChange('key', value, index) }} value={header.key} style={{ width: '100%' }} hintText={keyHintText || 'key'} />
          <TextField onChange={(event, value) => { onChange('value', value, index) }} value={header.value} style={{ width: '100%' }} hintText={valueHintText || 'value'} />
        </div>
      )
    });

  return (
    <div style={{ display: 'flex', flexDirection: 'row', width: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
        {headersList}
      </div>
      <div>
        <FloatingActionButton onClick={onAdd} mini>
          <ContentAdd />
        </FloatingActionButton>
      </div>
    </div>
  )
}

const HttpMethodDropdown = (props) => {
  const httpMethods = ['POST', 'GET', 'PUT', 'PATCH', 'DELETE'];
  const { onChange, value } = props;
  return (<DropDownMenu
    autoWidth={false}
    style={{ width: '150px', marginLeft: '-25px', height: '50px' }}
    value={value}
    onChange={(event, keyNumber, value) => { onChange(value) }}
  >
    {
      httpMethods.map((method, index) => {
        return (<MenuItem key={index} value={method} primaryText={method} />
        )
      })
    }
  </DropDownMenu>);
}
