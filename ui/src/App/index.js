import React, { Fragment } from 'react';
import GetTests from '../features/get-tests';
import GetProcessors from '../features/get-processors';
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
import menuList from '../features/mainMenu';
import get from 'lodash/get'

class App extends React.Component {
    state = {
      openSnakeBar: false
    };

    handleRequestClose = () => {
      this.setState({
        openSnakeBar: false
      });
    };

    render () {
      return (
          <ConnectedRouter history={history}>
            <DrawerE history={history} open={true} listItemData={menuList}>
              <Route exact path='/' render={() => (
                <Redirect to='/last_reports' />
              )} />
              <Route exact path='/tests' render={props => (
                <GetTests {...props} />
              )} />
              <Route exact path='/tests/:testId/run' render={props => (
                <GetTests {...props} />
              )} />
                <Route exact path='/tests/:testId/edit' render={props => (
                    <GetTests {...props} />
                )} />
              <Route exact path='/jobs' render={props => (
                <GetJobs {...props} />
              )} />
              <Route exact path='/tests/:testId/reports' render={props => (
                <GetTestReports {...props} />
              )} />
              <Route exact path='/last_reports' render={props => (
                <GetReports {...props} />
              )} />
              <Route exact path='/processors' render={props => (
                <GetProcessors {...props} />
              )} />
              <Route exact path='/webhooks' render={props => (
                <Webhooks {...props} />
              )} />
            <Route exact path='/settings' render={props => (
                <Configuration {...props} />
             )} />
                <Route exact path='/tests/:testId/reports/:reportId' render={props => (
                    <ReportPage {...props} />
                )} />
            </DrawerE>
          </ConnectedRouter>
      )
    }
}

function mapStateToProps (state) {
  return {
      location: get(state, 'router.location.pathname')
  }
}

const mapDispatchToProps = {
};

export default connect(mapStateToProps, mapDispatchToProps)(hot(module)(App));
