import React, { Fragment } from 'react';
import GetTests from '../features/get-tests';
import GetJobs from '../features/get-jobs';
import GetReports from '../features/get-last-reports';
import GetTestReports from '../features/get-test-reports';
import ConfigurationForm from '../features/components/ConfigurationForm';
import { Route, Redirect } from 'react-router';
import { connect } from 'react-redux';
import { ConnectedRouter } from 'react-router-redux';
import history from '../store/history';
import { hot } from 'react-hot-loader';
import DrawerE from '../features/components/DrawerE';
import menuList from '../features/mainMenu';

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
            <DrawerE history={history} open={true} listItemData={menuList}>
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
                <ConfigurationForm key={props.match.params.instance} {...props} />
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
