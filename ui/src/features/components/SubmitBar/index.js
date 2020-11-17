import Button from "../../../components/Button";
import React from "react";


const SubmitBar = ({onSubmit, onCancel, loading, disabled}) => {

    return (<div style={{display: 'flex', justifyContent: 'flex-end'}}>
        {onCancel && <Button style={{marginRight: '10px'}} inverted onClick={onCancel}>Cancel</Button>}
        <Button spinner={loading} hover disabled={disabled}
                onClick={onSubmit}>Submit</Button>
    </div>);
};

export default SubmitBar;
