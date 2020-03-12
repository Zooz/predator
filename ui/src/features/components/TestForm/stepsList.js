import React from 'react';
import CollapsibleStep from './collapsibleStep';

export default class StepsList extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        const {
            onChangeValueOfStep,
            processorsExportedFunctions,
            onBeforeStepProcessorChange,
            onAfterStepProcessorChange,
            beforeStepProcessorValue,
            afterStepProcessorValue,
            onDeleteStep,
            onDuplicateStep,
        } = this.props;
        return (<div style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            flexDirection: 'column',
        }}>

            {
                this.props.steps.map((step,index) => {

                    return (
                            <CollapsibleStep
                                index={index}
                                key={index}
                                step={step}
                                onChangeValueOfStep={onChangeValueOfStep}
                                processorsExportedFunctions={processorsExportedFunctions}
                                onBeforeStepProcessorChange={onBeforeStepProcessorChange}
                                onAfterStepProcessorChange={onAfterStepProcessorChange}
                                beforeStepProcessorValue={beforeStepProcessorValue}
                                afterStepProcessorValue={afterStepProcessorValue}
                                onDeleteStep={onDeleteStep}
                                onDuplicateStep={onDuplicateStep}
                            />
                    )
                })

            }
        </div>)

    }

}
