import React, { Fragment } from 'react';
import GetTests from '../features/PerformanceUI/instance/get-tests';
import GetJobs from '../features/PerformanceUI/instance/get-jobs';
import GetReports from '../features/PerformanceUI/instance/get-last-reports';
import GetTestReports from '../features/PerformanceUI/instance/get-test-reports';
import GetConfiguration from '../features/PerformanceUI/instance/get-configuration';
import { Route, Redirect } from 'react-router';
import { connect } from 'react-redux';
import { ConnectedRouter } from 'react-router-redux';
import history from '../store/history';
import { hot } from 'react-hot-loader';
import DrawerE from '../features/PerformanceUI/components/DrawerE';
import menuList from '../features/PerformanceUI/mainMenu';

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
        <Fragment>
          <ConnectedRouter history={history}>
            <DrawerE history={history} open={false} listItemData={menuList}>
              <Route exact path='/' render={() => (
                <Redirect to='/last_reports' />
              )} />
              <Route exact path='/tests' render={props => (
                <GetTests key={props.match.params.instance} {...props} />
              )} />
              <Route exact path='/jobs' render={props => (
                <GetJobs key={props.match.params.instance} {...props} />
              )} />
              <Route exact path='/tests/:testId/reports' render={props => (
                <GetTestReports key={props.match.params.instance} {...props} />
              )} />
              <Route exact path='/last_reports' render={props => (
                <GetReports key={props.match.params.instance} {...props} />
              )} />
              <Route exact path='/configuration' render={props => (
                  <GetConfiguration key={props.match.params.instance} {...props} />
              )} />
            </DrawerE>
          </ConnectedRouter>
        </Fragment>

      )
    }
}

function mapStateToProps (state) {
  return {

  }
}

const mapDispatchToProps = {
};

export default connect(mapStateToProps, mapDispatchToProps)(hot(module)(App));
