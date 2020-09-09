import JSONInput from "react-json-editor-ajrm";
import locale from "react-json-editor-ajrm/locale/en";
import React, {useEffect, useState} from "react";
import MonacoEditor from "@uiw/react-monacoeditor";
import {CONTENT_TYPES} from './constants'
import DynamicKeyValueInput from './DynamicKeyValueInput';

const monacoOptions = {
    selectOnLineNumbers: true,
    roundedSelection: false,
    readOnly: false,
    cursorStyle: 'line',
    automaticLayout: true,
    theme: 'vs'
};

const BodyEditor = ({type, content, placeHolder, onChange}) => {
    let jsonEditorContent;
    if (typeof content !== "object") {
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
                        outerBox: {height: null, minHeight: '200px'},
                        container: {height: null, border: '1px solid #557EFF', minHeight: '200px'}
                    }}
                    // key={key}
                    id='a_unique_id'
                    placeholder={jsonEditorContent || placeHolder || {}}
                    colors={{
                        default: 'black',
                        background: 'white',
                        string: 'red',
                        keys: 'blue'
                    }}
                    locale={locale}
                    width={'100%'}
                    onChange={(value) => onChange(CONTENT_TYPES.APPLICATION_JSON, value)}
                />
            )

        case CONTENT_TYPES.OTHER:
            const monacoContent = typeof content === "object" ? JSON.stringify(content) : content;
            return (
                <div style={{border: '1px solid #557EFF', position: 'relative', width: '100%'}}>
                    <MonacoEditor
                        language='html'
                        value={monacoContent}
                        options={monacoOptions}
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


const FormEditor = ({content = {}, onChange}) => {
    const [state, setState] = useState([{}]);

    useEffect(() => {
        const value = Object.entries(content).map((entry) => ({key: entry[0], value: entry[1]}));
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
                              onChange={onDynamicInputChange} value={state}/>
    )

}


export default BodyEditor;
