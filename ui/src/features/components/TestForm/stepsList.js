import React from 'react';
import CollapsibleStep from './collapsibleStep';
import DragableWrapper from './dragableWrapper'
export default class StepsList extends React.Component {
  constructor (props) {
    super(props);
  }

  render () {
    const {
      onChangeValueOfStep,
      processorsExportedFunctions,
      onBeforeStepProcessorChange,
      onAfterStepProcessorChange,
      beforeStepProcessorValue,
      afterStepProcessorValue,
      onDeleteStep,
      onDuplicateStep,
      updateStepOrder,
      editMode
    } = this.props;
    return (<div style={{
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      flexDirection: 'column'
    }}>

      {
        this.props.steps.map((step, index) => {
          return (
            <DragableWrapper
              key={step.id}
              index={index}
              id={step.id}
              move={updateStepOrder}
            >
              <CollapsibleStep
                expandedOnStart={!editMode}
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
            </DragableWrapper>
          )
        })

      }
    </div>)
  }
}
