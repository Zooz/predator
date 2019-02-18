import RectangleAlignChildrenLeft from '../../../../components/RectangleAlign/RectangleAlignChildrenLeft'
import TextField from 'material-ui/TextField';
import Slider from 'material-ui/Slider';

import React from 'react';

const AddScenarioForm = (props) => {
  const onChangeValue = (key, value) => {
    const { onChangeValue } = props;
    onChangeValue(key, value);
  };

  const { scenario, allowedWeight } = props;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      <TextField id={'name'} value={scenario.scenario_name} onChange={(event, value) => {
        onChangeValue('scenario_name', value);
      }} />
      {
        !!allowedWeight &&
        <RectangleAlignChildrenLeft>
          <span>0%</span>
          <div>
            <Slider
              style={{ width: '245px' }}
              min={0}
              max={allowedWeight}
              step={1}
              value={scenario.weight || 0}
              onChange={(event, value) => onChangeValue('weight', value)}
            />
          </div>
          <span>{allowedWeight}%</span>
        </RectangleAlignChildrenLeft>

      }
      <span>The weight of this scenario will be: {scenario.weight || 0}%</span>

      {!allowedWeight && <span>The weights of all your other scenarios is 100%</span>}

    </div>
  )
}

export default AddScenarioForm;
