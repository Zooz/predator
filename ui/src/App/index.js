import React, { Fragment } from 'react';
import GetTests from '../features/get-tests';
import GetJobs from '../features/get-jobs';
import GetReports from '../features/get-last-reports';
import GetTestReports from '../features/get-test-reports';
import Configuration from '../features/get-configuration';
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
              <Route exact path='/jobs' render={props => (
                <GetJobs {...props} />
              )} />
              <Route exact path='/tests/:testId/reports' render={props => (
                <GetTestReports {...props} />
              )} />
              <Route exact path='/last_reports' render={props => (
                <GetReports {...props} />
              )} />
            <Route exact path='/configuration' render={props => (
                <Configuration {...props} />
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
