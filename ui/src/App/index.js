import React from 'react';
import GetTests from '../features/get-tests';
import GetProcessors from '../features/get-processors';
import GetChaosExperiments from '../features/get-chaos-experiments';
import GetJobs from '../features/get-jobs';
import GetReports from '../features/get-last-reports';
import GetTestReports from '../features/get-test-reports';
import Configuration from '../features/get-configuration';
import ReportPage from '../features/report-page';
import Webhooks from '../features/webhooks';
import { Route, Redirect } from 'react-router';
import { connect } from 'react-redux';
import { ConnectedRouter } from 'react-router-redux';
import history from '../store/history';
import { hot } from 'react-hot-loader';
import DrawerE from '../features/components/DrawerE';
import getMenuList from '../features/mainMenu';
import get from 'lodash/get'
import { config, errorOnGetConfig, processingGetConfig } from '../features/redux/selectors/configSelector';
import * as Actions from '../features/redux/action';
import Loader from '../features/components/Loader';
import { ERROR_GET_CONFIG_MESSAGE, CHAOS_MESH_ENABLED } from '../constants';

class App extends React.Component {
    state = {
      openSnakeBar: false
    };

    handleRequestClose = () => {
      this.setState({
        openSnakeBar: false
      });
    };

    componentDidMount () {
      this.props.getConfig();
    }

    render () {
      const {
        config,
        errorOnGetConfig,
        processingGetConfig
      } = this.props;
      if (errorOnGetConfig) return <div>{ERROR_GET_CONFIG_MESSAGE}</div>;
      if (processingGetConfig) return <div><Loader /></div>
      if (config && !errorOnGetConfig && !processingGetConfig) {
        const featureToggles = {
          CHAOS_MESH_ENABLED: false
        };
        const menuList = getMenuList(featureToggles);

        return (
          <ConnectedRouter history={history}>
            <DrawerE history={history} open listItemData={menuList}>
              <Route exact path='/' render={() => (
                <Redirect to='/last_reports' />
              )} />
              <Route exact path='/tests' render={props => (
                <GetTests {... { ...props, featureToggles }} />
              )} />
              <Route exact path='/tests/:testId/run' render={props => (
                <GetTests {... { ...props, featureToggles }} />
              )} />
              <Route exact path='/tests/:testId/edit' render={props => (
                <GetTests{... { ...props, featureToggles }} />
              )} />
              <Route exact path='/jobs' render={props => (
                <GetJobs {... { ...props, featureToggles }} />
              )} />
              <Route exact path='/jobs/:jobId/edit' render={props => (
                <GetJobs {... { ...props, featureToggles }} />
              )} />
              <Route exact path='/tests/:testId/reports' render={props => (
                <GetTestReports {... { ...props, featureToggles }} />
              )} />
              <Route exact path='/last_reports' render={props => (
                <GetReports {... { ...props, featureToggles }} />
              )} />
              <Route exact path='/processors' render={props => (
                <GetProcessors {... { ...props, featureToggles }} />
              )} />
              <Route exact path='/chaos_experiments' render={props => (
                <GetChaosExperiments {... { ...props, featureToggles }} />
              )} />
              <Route exact path='/webhooks' render={props => (
                <Webhooks {... { ...props, featureToggles }} />
              )} />
              <Route exact path='/settings' render={props => (
                <Configuration {... { ...props, config }} />
              )} />
              <Route exact path='/tests/:testId/reports/:reportId' render={props => (
                <ReportPage {... { ...props, featureToggles }} />
              )} />
            </DrawerE>
          </ConnectedRouter>
        )
      } else {
        return null;
      }
    }
}

function mapStateToProps (state) {
  return {
    location: get(state, 'router.location.pathname'),
    config: config(state),
    processingGetConfig: processingGetConfig(state),
    errorOnGetConfig: errorOnGetConfig(state)
  }
}

const mapDispatchToProps = {
  getConfig: Actions.getConfig
};

export default connect(mapStateToProps, mapDispatchToProps)(hot(module)(App));
