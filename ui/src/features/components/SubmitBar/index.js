import Button from "../../../components/Button";
import React from "react";


const SubmitBar = ({onSubmit, onCancel, loading, disabled, onTest, testDisabled}) => {
    return (<div style={{display: 'flex', justifyContent: 'flex-end'}}>
        {onTest && <Button disabled={testDisabled} style={{marginRight: '10px'}} inverted onClick={onTest}>Test</Button>}
        {onCancel && <Button style={{marginRight: '10px'}} inverted onClick={onCancel}>Cancel</Button>}
        <Button spinner={loading} hover disabled={disabled}
                onClick={onSubmit}>Submit</Button>
    </div>);
};

export default SubmitBar;
