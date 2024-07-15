import React from 'react';
import { connect } from 'react-redux';
import {
  errorOnGetConfig,
  processingGetConfig,
  processingUpdateConfig,
  cleanFinishedContainersSuccess,
  cleanFinishedContainersFailure
} from './redux/selectors/configSelector';
import * as Actions from './redux/action';
import Loader from '../features/components/Loader';
import ConfigurationForm from './components/ConfigurationForm';
import Page from '../components/Page';
import Card from '../components/Card';
import style from './get-configuration.scss'
import TitleInput from '../components/TitleInput';
import classnames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import ErrorDialog from '../features/components/ErrorDialog';

import {
  faTrashAlt
} from '@fortawesome/free-solid-svg-icons'
import Snackbar from 'material-ui/Snackbar';
import { ERROR_GET_CONFIG_MESSAGE } from '../constants';
const CardWithTitle = ({ children, title, className }) => {
  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', width: '50%' }}>
      <h1 style={{ marginTop: '0px' }} color={'#555555'}>{title}</h1>
      <Card className={style['card-wrapper']}>
        {children}
      </Card>
    </div>

  )
};

class getConfiguration extends React.Component {
  constructor (props) {
    super(props);
  }

  render () {
    const { config, errorOnGetConfig, processingGetConfig, cleanFinishedContainersSuccess, cleanFinishedContainersFailure } = this.props;
    const currentError = cleanFinishedContainersFailure || errorOnGetConfig;
    if (processingGetConfig) return <div><Loader /></div>
    if (config && !errorOnGetConfig && !processingGetConfig) {
      return (
        <Page title={'Settings'} description={'Customize Predator behavior'}>
          <div>
            {errorOnGetConfig ? ERROR_GET_CONFIG_MESSAGE : null}
            {processingGetConfig && <Loader />}
            {(config && !errorOnGetConfig && !processingGetConfig) &&
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}>
                <CardWithTitle title={'Configuration'}>
                  <ConfigurationForm history={this.props.history} config={config} />
                </CardWithTitle>
                <CardWithTitle title={'Housekeeping'}>
                  <div className={style['configuration-item-wrapper']}>
                    <TitleInput title={'Clean up finished containers'} />
                    <FontAwesomeIcon
                      className={classnames(style['icon'], {
                        [style['action-style']]: true,
                        [style['disabled-button']]: false
                      })}
                      onClick={this.props.cleanFinishedContainers} icon={faTrashAlt} />
                  </div>
                </CardWithTitle>
              </div>
            }
          </div>
          {cleanFinishedContainersSuccess && <Snackbar
            open={cleanFinishedContainersSuccess}
            bodyStyle={{ backgroundColor: '#2fbb67' }}
            message={`${cleanFinishedContainersSuccess.deleted} containers were deleted`}
            autoHideDuration={4000}
            onRequestClose={() => this.props.setCleanFinishedContainersSuccess(undefined)}
          />}

          {currentError &&
            <ErrorDialog closeDialog={() => {
              this.props.setCleanFinishedContainersFailure(undefined);
              this.props.getConfigFailure(undefined);
            }} showMessage={currentError.message} />}

        </Page>
      )
    }
  }
}

function mapStateToProps (state) {
  return {
    processingGetConfig: processingGetConfig(state),
    processingUpdateConfig: processingUpdateConfig(state),
    errorOnGetConfig: errorOnGetConfig(state),
    cleanFinishedContainersSuccess: cleanFinishedContainersSuccess(state),
    cleanFinishedContainersFailure: cleanFinishedContainersFailure(state)
  }
}

const mapDispatchToProps = {
  cleanFinishedContainers: Actions.cleanFinishedContainers,
  setCleanFinishedContainersFailure: Actions.cleanFinishedContainersFailure,
  setCleanFinishedContainersSuccess: Actions.cleanFinishedContainersSuccess

};

export default connect(mapStateToProps, mapDispatchToProps)(getConfiguration);
