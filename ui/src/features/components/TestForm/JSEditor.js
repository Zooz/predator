import React, { useState } from 'react';

import Modal from '../Modal';
import style from './style.scss';
import MonacoEditor from '@uiw/react-monacoeditor';
import Button from '../../../components/Button';

export default function JSEditor ({ javaScript, closeJSEditor }) {
  const [JSContent, setJSContent] = useState(javaScript);

  const onInputCodeChange = (code) => {
    setJSContent(code)
  }
  const options = {
    selectOnLineNumbers: true,
    roundedSelection: false,
    readOnly: false,
    cursorStyle: 'line',
    automaticLayout: false,
    theme: 'vs'
  }
  return (
    <Modal onExit={closeJSEditor}>
      <div className={style['bottom']}>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <MonacoEditor
            language='javascript'
            value={JSContent}
            options={options}
            height='500px'
            width='100%'
            onChange={onInputCodeChange}
            scrollbar={{
              useShadows: false,
              verticalHasArrows: true,
              horizontalHasArrows: true,
              vertical: 'visible',
              horizontal: 'visible',
              verticalScrollbarSize: 17,
              horizontalScrollbarSize: 17,
              arrowSize: 30
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '230px' }}>
            <Button inverted onClick={closeJSEditor}>Cancel</Button>
            <Button hover
              onClick={() => {}}>Submit</Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
