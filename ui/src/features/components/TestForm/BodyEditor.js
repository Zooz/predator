import JSONInput from 'react-json-editor-ajrm';
import locale from 'react-json-editor-ajrm/locale/en';
import React, { useEffect, useState } from 'react';
import MonacoEditor from '@uiw/react-monacoeditor';
import { CONTENT_TYPES } from './constants'
import DynamicKeyValueInput from './DynamicKeyValueInput';
import useEditorTheme from '../useEditorTheme';

// react-json-editor-ajrm applies these as inline styles and cannot resolve var(),
// so read the computed token values off the document root.
const token = (name, fallback) => {
  if (typeof window === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
};

const jsonColors = (editorTheme) => {
  const dark = editorTheme === 'vs-dark';
  return {
    default: token('--fg-primary', dark ? '#e8edf6' : '#0d1220'),
    background: token('--bg-surface', dark ? '#0d1220' : '#ffffff'),
    background_warning: token('--breach-bg', dark ? '#3a1417' : '#fdeaeb'),
    string: token('--series-2', dark ? '#17a97a' : '#0a9e6e'),
    number: token('--series-3', dark ? '#bd8226' : '#c47512'),
    colon: token('--fg-muted', '#8695b0'),
    keys: token('--series-1', dark ? '#5f7ee8' : '#4468f5'),
    keys_whiteSpace: token('--series-5', dark ? '#8f6ef0' : '#8b5cf6'),
    primitive: token('--series-6', dark ? '#1f9fbb' : '#0e9bb5')
  };
};

const monacoOptions = {
  selectOnLineNumbers: true,
  roundedSelection: false,
  readOnly: false,
  cursorStyle: 'line',
  automaticLayout: true
};

const BodyEditor = ({ type, content, placeHolder, onChange, boxMinHeight }) => {
  const editorTheme = useEditorTheme();
  let jsonEditorContent;
  if (typeof content !== 'object') {
    try {
      jsonEditorContent = JSON.parse(content);
    } catch (err) {

    }
  } else {
    jsonEditorContent = content;
  }
  switch (type) {
  case CONTENT_TYPES.FORM:
  case CONTENT_TYPES.FORM_DATA:
    return (
      <FormEditor
        content={jsonEditorContent}
        onChange={(value) => onChange(CONTENT_TYPES.FORM, value)}
      />
    );

  case CONTENT_TYPES.APPLICATION_JSON:
    return (
      <JSONInput
        style={{
          outerBox: { height: null, minHeight: boxMinHeight || '200px', borderRadius: 'var(--radius-md)', overflow: 'hidden' },
          container: {
            height: null,
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            minHeight: boxMinHeight || '200px',
            fontFamily: 'var(--font-mono)'
          },
          body: { fontFamily: 'var(--font-mono)', fontSize: '13px' },
          labelColumn: { color: 'var(--fg-muted)' }
        }}
        // key={key}
        id='a_unique_id'
        placeholder={jsonEditorContent || placeHolder || {}}
        // This library takes literal colour values rather than CSS, so the syntax
        // palette is resolved from the tokens at render time instead of hardcoded.
        colors={jsonColors(editorTheme)}
        locale={locale}
        width={'100%'}
        onChange={(value) => onChange(CONTENT_TYPES.APPLICATION_JSON, value)}
      />
    )

  case CONTENT_TYPES.OTHER:
    const monacoContent = typeof content === 'object' ? JSON.stringify(content) : content;
    return (
      <div style={{ border: '1px solid #557EFF', position: 'relative', width: '100%' }}>
        <MonacoEditor
          language='html'
          value={monacoContent}
          options={{ ...monacoOptions, theme: editorTheme }}
          height={'200px'}
          width='100%'
          onChange={(value) => onChange(CONTENT_TYPES.OTHER, value)}
          scrollbar={{
            // Subtle shadows to the left & top. Defaults to true.
            useShadows: false,
            // Render vertical arrows. Defaults to false.
            verticalHasArrows: false,
            // Render horizontal arrows. Defaults to false.
            horizontalHasArrows: false,
            // Render vertical scrollbar.
            // Accepted values: 'auto', 'visible', 'hidden'.
            // Defaults to 'auto'
            vertical: 'hidden',
            // Render horizontal scrollbar.
            // Accepted values: 'auto', 'visible', 'hidden'.
            // Defaults to 'auto'
            horizontal: 'hidden',
            verticalScrollbarSize: 17,
            horizontalScrollbarSize: 17,
            arrowSize: 30
          }}
        />
      </div>
    );
  case 'none':
    return null;
  default:
    return (
      <div>not supported</div>
    )
  }
}

const FormEditor = ({ content = {}, onChange }) => {
  const [state, setState] = useState([{}]);

  useEffect(() => {
    const value = Object.entries(content).map((entry) => ({ key: entry[0], value: entry[1] }));
    if (value.length === 0) {
      setState([{}]);
    } else {
      setState(value);
    }
  }, []);

  const onDynamicInputChange = (type, value, index) => {
    state[index][type] = value;
    const newContent = state.reduce((acc, cur) => {
      if (cur.key) {
        acc[cur.key] = cur.value;
      }
      return acc;
    }, {});
    onChange(newContent);
  };

  const onAdd = () => {
    state.push({});
    setState([...state]);
  };
  const onDelete = (index) => {
    state.splice(index, 1);
    setState([...state]);
  };

  return (
    <DynamicKeyValueInput onAdd={onAdd} onDelete={onDelete} keyHintText={'key'} valueHintText={'value'}
      onChange={onDynamicInputChange} value={state} />
  )
}

export default BodyEditor;
