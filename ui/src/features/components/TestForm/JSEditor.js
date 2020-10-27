import React from 'react';
import MonacoEditor from '@uiw/react-monacoeditor';

export default function JSEditor ({ javaScript, onInputCodeChange }) {
  const options = {
    selectOnLineNumbers: true,
    roundedSelection: false,
    readOnly: false,
    cursorStyle: 'line',
    automaticLayout: false,
    theme: 'vs'
  }
  return (
    <div style={{ border: '1px solid #557EFF', position: 'relative', width: '100%' }}>
      <MonacoEditor
        language='javascript'
        value={javaScript}
        options={options}
        height='200px'
        width='100%'
        onChange={onInputCodeChange}
        scrollbar={{
          useShadows: false,
          verticalHasArrows: false,
          horizontalHasArrows: false,
          vertical: 'hidden',
          horizontal: 'hidden',
          verticalScrollbarSize: 17,
          horizontalScrollbarSize: 17,
          arrowSize: 30
        }}
      />
    </div>
  )
}
