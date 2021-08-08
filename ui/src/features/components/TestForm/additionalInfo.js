import React from 'react';
import TitleInput from '../../../components/TitleInput';
import BodyEditor from './BodyEditor';
import { CONTENT_TYPES } from './constants';
import UiSwitcher from '../../../../src/components/UiSwitcher';

export default class AdditionalInfo extends React.Component {
  constructor (props) {
    super(props);
    const { additionalInfo } = props.scenario;
    this.state = {
      isActive: additionalInfo && Object.keys(additionalInfo).length > 0
    }
  };

  onEnableDisable = (value) => {
    const { scenario, onChangeValue } = this.props;
    const { additionalInfo, additionalInfoLastBody } = scenario;
    if (value) { // if enabled
      onChangeValue('additionalInfo', additionalInfoLastBody);
    } else {
      onChangeValue('additionalInfo', undefined);
      onChangeValue('additionalInfoLastBody', additionalInfo);
    }
    this.setState({ isActive: value });
  };

  render () {
    const { scenario, onChangeValue } = this.props;
    return (
      <TitleInput style={{ marginTop: '10px' }}
        title={'Additional Information'}
        alignToRight
        leftComponent={<UiSwitcher
          onChange={(value) => {
            this.onEnableDisable(value)
          }}
          disabledInp={false}
          activeState={this.state.isActive}
          height={12}
          width={22}
          style={{ marginRight: '5px' }}
        />}>
        {this.state.isActive ? <BodyEditor type={CONTENT_TYPES.APPLICATION_JSON}
          content={scenario.additionalInfo}
          onChange={(key, value) => onChangeValue('additionalInfo', value.jsObject)}
          boxMinHeight={'100px'} /> : <div />}
      </TitleInput>
    )
  }
}
