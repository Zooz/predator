import {EXPECTATIONS_SPEC, EXPECTATIONS_SPEC_BY_PROP} from './constants'
import {createDefaultExpectation} from './utils';
import DynamicKeyValueInput from "./DynamicKeyValueInput";
import React from "react";


const dropdownOptions = EXPECTATIONS_SPEC.map((spec) => {
    return spec.propertyName;
});
const Expectations = ({step, stepIndex, onChangeStep}) => {
    const onChange = (prop, value, index) => {
        const newStep = {...step};
        newStep.expectations[index][prop] = value;
        onChangeStep(newStep, stepIndex);
    };
    const onChangeType = (value, index) => {
        const newStep = {...step};
        newStep.expectations[index] = {type: value, ...EXPECTATIONS_SPEC_BY_PROP[value]};
        onChangeStep(newStep, stepIndex);

    };
    const onAddExpectation = () => {
        const newStep = {...step};
        newStep.expectations.push(createDefaultExpectation());
        onChangeStep(newStep, stepIndex);

    };

    const onDeleteExpectation = (index) => {
        const newStep = {...step};
        newStep.expectations.splice(index, 1);
        onChangeStep(newStep, stepIndex);

    };

    return (
        <DynamicKeyValueInput value={step.expectations}
                              onChange={onChange}
                              onAdd={onAddExpectation}
                              onDelete={onDeleteExpectation}
                              dropdownOptions={dropdownOptions}
                              dropDownPlaceHolder={'Type'}
                              dropDownOnChange={onChangeType}
        />
    );


};

export default Expectations;
