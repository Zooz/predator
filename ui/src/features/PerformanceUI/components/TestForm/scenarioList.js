import React from 'react';
import DragableWrapper from './dragableWrapper';
import Button from './Button';
import classnames from 'classnames';
import style from './scenarioList.scss';
const actions = ['Delete', 'Duplicate'];
export default (props) => {
  const { scenarios, currentScenarioIndex, currentStepIndex, updateStepOrder, onChooseScenario,
    onChooseStep, before, onChooseBefore, isBeforeSelected, onDeleteStep, onDuplicateStep, onDeleteScenario, onDuplicateScenario } = props;

  const actionStepHandler = (action) => {
    switch (action) {
    case 'Delete':
      return onDeleteStep();
    case 'Duplicate':
      return onDuplicateStep();
    default:
      throw new Error('Unsupported action');
    }
  };
  const actionScenarioHandler = (action) => {
    switch (action) {
    case 'Delete':
      return onDeleteScenario();
    case 'Duplicate':
      return onDuplicateScenario();
    default:
      throw new Error('Unsupported action');
    }
  };
  const buildStep = (steps) => {
    return steps.map((step, index) => {
      const isStepSelected = index === currentStepIndex;
      return (
        <DragableWrapper
          key={step.id}
          index={index}
          id={step.id}
          move={updateStepOrder}
        >
          <Button onClick={() => { onChooseStep(index) }}
            label={step.method}
            className={classnames({ [style['button-selected']]: isStepSelected }, style['button'], style['step-button'])}
            actionHandler={actionStepHandler}
            menuActions={actions}
          />
        </DragableWrapper>
      )
    });
  };

  let result = scenarios.map((scenario, index) => {
    let scenarioSteps = null;
    if (currentScenarioIndex === index) {
      scenarioSteps = buildStep(scenario.steps);
    }
    const isScenarioSelected = currentScenarioIndex === index;
    return (
      <div className={style['scenario-wrapper']} key={index}>
        <Button onClick={() => { onChooseScenario(index) }}
          label={scenario.scenario_name} style={{ width: '100%' }}
          key={scenario.id}
          className={classnames({ [style['button-selected']]: isScenarioSelected }, style['button'])}
          menuActions={actions}
          actionHandler={actionScenarioHandler}
        />
        {scenarioSteps}
      </div>
    )
  });
  let beforeSteps;
  if (before && isBeforeSelected) {
    beforeSteps = buildStep(before.steps)
  }
  if (before) {
    result = [<div key={'before'} className={style['scenario-wrapper']}>
      <Button onClick={onChooseBefore} label={'Before'} className={classnames({ [style['button-selected']]: isBeforeSelected }, style['button'])} />
      {beforeSteps}
    </div>].concat(result);
  }
  return result;
}
