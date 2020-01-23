import RectangleAlignChildrenLeft from '../../../components/RectangleAlign/RectangleAlignChildrenLeft'
import TextField from 'material-ui/TextField';
import Slider from 'material-ui/Slider';

import React from 'react';
import ProcessorsDropDown from "./ProcessorsDropDown";

const TextSideWrapper = ({title, children, textStyle = {}}) => {
    return (
        <RectangleAlignChildrenLeft>
            <div style={{marginRight: '10px', width: '110px', ...textStyle}}>{title}</div>
            <div style={{flex: 1}}>{children}</div>
        </RectangleAlignChildrenLeft>
    )
};
const AddScenarioForm = (props) => {
    const onChangeValue = (key, value) => {
        const {onChangeValue} = props;
        onChangeValue(key, value);
    };

    const {scenario, allowedWeight, processorsExportedFunctions} = props;
    return (
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'left', width: '100%'}}>
            <TextSideWrapper title={'Scenario Name:'}>
                <TextField id={'name'} value={scenario.scenario_name} onChange={(event, value) => {
                    onChangeValue('scenario_name', value);
                }}/>
            </TextSideWrapper>


            <TextSideWrapper title={'Before Scenario:'} textStyle={{marginRight: -13}}>
                <ProcessorsDropDown options={processorsExportedFunctions}
                                    onChange={(value) => onChangeValue('beforeScenario', value)}
                                    value={scenario.beforeScenario}/>
            </TextSideWrapper>

            <TextSideWrapper title={'After Scenario:'} textStyle={{marginRight: -13}}>
                <ProcessorsDropDown options={processorsExportedFunctions}
                onChange={(value) => onChangeValue('afterScenario', value)}
                value={scenario.afterScenario}/>
                </TextSideWrapper>




            <div style={{
                display: 'flex',
                flex: 1,
                justifyContent: 'center',
                flexDirection: 'column',
                alignItems: 'center'
            }}>
                {!!allowedWeight &&
                <RectangleAlignChildrenLeft>
                    <span>0%</span>
                    <div>
                        <Slider
                            style={{width: '245px'}}
                            min={0}
                            max={allowedWeight}
                            step={1}
                            value={scenario.weight || 0}
                            onChange={(event, value) => onChangeValue('weight', value)}
                        />
                    </div>
                    <span>{allowedWeight}%</span>
                </RectangleAlignChildrenLeft>}
                <span>The weight of this scenario will be: {scenario.weight || 0}%</span>

                {!allowedWeight && <span>The weights of all your other scenarios is 100%</span>}

            </div>
        </div>
    )
}

export default AddScenarioForm;
