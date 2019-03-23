import React from 'react';
import { connect } from 'react-redux';
import { config, configDataMap, errorOnGetConfig, errorOnUpdateConfig, processingGetConfig, processingUpdateConfig, processGetConfigDataMap } from './redux/selectors/configSelector';
import 'react-bootstrap-table/dist/react-bootstrap-table-all.min.css';
import style from './style.scss';
import * as Actions from './redux/action';
import Loader from '../components/Loader';
import Page from '../../../components/Page';
import ConfigurationForm from '../components/ConfigurationForm';
import history from "../../../store/history";
const noDataMsg = 'There is no data to display.';
const errorMsgGetConfig = 'Error occurred while trying to get Predator configuration.';
let parsedConfigDataMap;

class getConfiguration extends React.Component {
  constructor (props) {
    super(props);
  }

  componentDidMount () {
      this.loadPageData();
    }

    loadPageData = () => {
      this.props.getConfig();
      this.props.getConfigDataMap();
    };

    componentWillUnmount () {

    }

    loader () {
      return (this.props.processingGetConfig || this.props.processGetConfigDataMap) ? <Loader /> : noDataMsg;
    }

    render () {
      if (!parsedConfigDataMap && this.props.configDataMap) {
        parsedConfigDataMap = parseConfigDataMap(this.props.configDataMap);
      }

      return (
          <Page title={'Predator Configuration'}>
            <div className={style.getTests}>
              <div className={style.tableDiv}>
                {(this.props.configDataMap && this.props.config)
                    ? <ConfigurationForm history={history} configDataMap={this.props.configDataMap} config={this.props.config} parsedConfig={parsedConfigDataMap} /> : this.loader()}
              </div>
            </div>
          </Page>
      )
    }
}

function parseConfigDataMap (configDataMap) {
  let parsedConfigDataMap = {};

  Object.keys(configDataMap).forEach((configKey) => {
      if (configDataMap[configKey].type !== 'json') {
        if (!parsedConfigDataMap['General']) {
          parsedConfigDataMap['General'] = [];
        }
        const configValueElement = {
          name: configKey,
          value: configDataMap[configKey].value || '',
          type: configDataMap[configKey].type
        };
        parsedConfigDataMap['General'].push(configValueElement);
      } else {
          parsedConfigDataMap[configKey] = [];
          let configValueElement;
          if (configDataMap[configKey].value) {
            Object.keys(configDataMap[configKey].value).forEach((key) => {
              configValueElement = {
                name: key,
                value: configDataMap[configKey].value[key].value || '',
                type: configDataMap[configKey].value[key].type
              };
              parsedConfigDataMap[configKey].push(configValueElement)
            });
          } else {
            configValueElement = {
              name: configKey,
              value: '',
              type: configDataMap[configKey].type
            };
            parsedConfigDataMap[configKey].push(configValueElement)
          }
      }
  });

  return parsedConfigDataMap;
}

function mapStateToProps (state) {
  return {
    config: config(state),
    configDataMap: configDataMap(state),
    processingGetConfig: processingGetConfig(state),
    processingUpdateConfig: processingUpdateConfig(state),
    processGetConfigDataMap: processGetConfigDataMap(state),
    errorOnGetConfig: errorOnGetConfig(state),
    errorOnUpdateConfig: errorOnUpdateConfig(state)
  }
}

const mapDispatchToProps = {
  getConfig: Actions.getConfig,
  getConfigDataMap: Actions.getConfigDataMap,
  getConfigDataMapSuccess: Actions.getConfigDataMapSuccess,
  getConfigSuccess: Actions.getConfigSuccess,
  getConfigFailure: Actions.getConfigFailure,
  updateConfigFailure: Actions.updateConfigFailure,
  updateConfigSuccess: Actions.updateConfigSuccess
};

export default connect(mapStateToProps, mapDispatchToProps)(getConfiguration);
