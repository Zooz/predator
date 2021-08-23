import React from 'react';
import TitleInput from '../../../components/TitleInput';
import BodyEditor from './BodyEditor';
import { CONTENT_TYPES } from './constants';
import UiSwitcher from '../../../../src/components/UiSwitcher';

const AdditionalInfo = (props) => {
  const onEnableDisable = (value) => {
    const { scenario, onChangeValue } = props;
    const { additionalInfo } = scenario;
    const newAdditionalInfo = {
      isEnable: value,
      body: additionalInfo.body
    }
    onChangeValue('additionalInfo', newAdditionalInfo);
  };

  const { scenario, onChangeValue } = props;
  return (
    <TitleInput style={{ marginTop: '10px' }}
      title={'Additional Information'}
      alignToRight
      leftComponent={<UiSwitcher
        onChange={(value) => {
          onEnableDisable(value)
        }}
        disabledInp={false}
        activeState={scenario.additionalInfo.isEnable}
        height={12}
        width={22}
        style={{ marginRight: '5px' }}
      />}>
      {scenario.additionalInfo.isEnable ? <BodyEditor type={CONTENT_TYPES.APPLICATION_JSON}
        content={scenario.additionalInfo.body}
        onChange={(key, value) => onChangeValue('additionalInfo', { isEnable: true, body: value.jsObject })}
        boxMinHeight={'100px'} /> : <div />}
    </TitleInput>
  )
}

export default AdditionalInfo;
