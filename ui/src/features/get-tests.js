import React from 'react';
import Snackbar from 'material-ui/Snackbar';
import { connect } from 'react-redux';
import {
  tests,
  test,
  processingGetTests,
  errorOnGetTests,
  errorOnGetTest,
  processingDeleteTest,
  deleteTestSuccess,
  errorOnDeleteTest
} from './redux/selectors/testsSelector';
import { createJobSuccess } from './redux/selectors/jobsSelector';
import style from './style.scss';
import Dialog from './components/Dialog';
import JobForm from './components/JobForm';
import * as Actions from './redux/action';
import Loader from './components/Loader';
import history from '../store/history'
import DeleteDialog from './components/DeleteDialog';
import Page from '../components/Page';
import TestForm from './components/TestForm';
import { ReactTableComponent } from '../components/ReactTable';
import { getColumns } from './configurationColumn';
import Button from '../components/Button';
import ErrorDialog from './components/ErrorDialog';
import _ from 'lodash';

const noDataMsg = 'There is no data to display.';
const errorMsgGetTests = 'Error occurred while trying to get all tests.';
const columnsNames = ['name', 'description', 'updated_at', 'type', 'run_test', 'report', 'edit', 'raw', 'clone', 'delete'];
const DESCRIPTION = 'Tests include end-to-end scenarios that are executed at pre-configured intervals to provide in-depth performance metrics of your API.';

class getTests extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      openViewTest: false,
      openViewCreateJob: false,
      openNewTestDialog: false,
      deleteDialog: false,
      testToDelete: undefined,
      createTest: false,
      testForEdit: null,
      sortedTests: [],
      sortHeader: ''
    }
  }

  componentDidUpdate (prevProps) {
    if (prevProps.tests !== this.props.tests) {
      this.setState({ sortedTests: [...this.props.tests], sortHeader: 'updated_at-' }, () => {
        this.onSort('updated_at');
      })
      const { match: { params, path } } = this.props;
      if (path === '/tests/:testId/run') {
        const data = this.props.tests.find((test) => test.id === params.testId);
        data && this.onRunTest(data);
      } else if (path === '/tests/:testId/edit') {
        const data = this.props.tests.find((test) => test.id === params.testId);
        data && this.onEdit(data);
      }
    }
  }

    onDelete = (data) => {
      this.setState({
        deleteDialog: true,
        testToDelete: data
      })
    }
    onSearch = (value) => {
      if (!value) {
        this.setState({ sortedTests: [...this.props.tests] })
      }
      const newSorted = _.filter(this.props.tests, (test) => {
        return (
          _.includes(String(test.name).toLowerCase(), value.toLowerCase()) ||
                _.includes(String(test.type).toLowerCase(), value.toLowerCase()) ||
                _.includes(String(test.description).toLowerCase(), value.toLowerCase())
        )
      });
      this.setState({ sortedTests: newSorted })
    };

    onSort = (field) => {
      const { sortHeader } = this.state;
      let isAsc = false;
      if (sortHeader.includes(field)) {
        isAsc = !sortHeader.includes('+')
      } else {
        isAsc = true;
      }
      let sortedReport;
      if (isAsc) {
        sortedReport = _.chain(this.state.sortedTests).sortBy(field).reverse().value();
      } else {
        sortedReport = _.chain(this.state.sortedTests).sortBy(field).value();
      }
      this.setState({ sortedTests: sortedReport, sortHeader: `${field}${isAsc ? '+' : '-'}` })
    };

    submitDelete = () => {
      this.props.deleteTest(this.state.testToDelete.id);
      this.setState({
        deleteDialog: false
      });
    };

    cancelDelete = () => {
      this.setState({
        deleteDialog: false
      });
    };

    onRawView = (data) => {
      this.setState({ openViewTest: data });
    };

    onEdit = (data) => {
      const { match: { params, path }, history } = this.props;
      if (path !== '/tests/:testId/edit') {
        history.replace(`/tests/${data.id}/edit`)
      }
      this.setState({ createTest: true, testForEdit: data });
      // this.props.chooseTest(data);
    };

    onReportView = (data) => {
      history.replace(`/tests/${data.id}/reports`)
    };

    onRunTest = (data) => {
      const { match: { params, path }, history } = this.props;
      if (path !== '/tests/:testId/run') {
        history.replace(`/tests/${data.id}/run`)
      }
      this.setState({
        openViewCreateJob: data
      });
    };

    closeViewTestDialog = () => {
      this.setState({
        openViewTest: false
      });
      this.props.clearSelectedTest();
    };
    closeCreateTest = () => {
      history.replace('/tests')
      this.setState({
        createTest: false,
        testForEdit: null,
        testForClone: null
      });
    };

    closeViewCreateJobDialog = () => {
      const { history } = this.props;
      history.replace('/tests')
      this.setState({
        openViewCreateJob: false
      });
      this.props.clearSelectedTest();
    };

    handleSnackbarClose = () => {
      this.props.clearSelectedJob();
      this.props.clearSelectedTest();
      this.props.clearAllSuccessOperationsState();
      this.setState({
        testToDelete: undefined
      });
    };

    loader () {
      return this.props.processingGetTests ? <Loader /> : noDataMsg
    }

    componentDidMount () {
      this.props.clearErrorOnGetTests();
      this.props.getAllTests();
    }

    componentWillUnmount () {
      this.props.clearErrorOnGetTests();
      this.props.clearSelectedTest();
    }

    componentWillReceiveProps () {
      if (this.props.createJobSuccess) {
        this.setState({
          openViewCreateJob: false
        });
      }
    }

    onCloseErrorDialog = () => {
      this.props.cleanAllErrors();
    };
    onClone = (data) => {
      this.setState({ createTest: true, testForClone: data });
    };
    generateFeedbackMessage = () => {
      const { createJobSuccess, deleteTestSuccess } = this.props;
      if (createJobSuccess && createJobSuccess.run_id) {
        return `Job created successfully with Run ID: ${this.props.createJobSuccess.run_id}`;
      } else if (deleteTestSuccess) {
        return 'Test deleted successfully';
      }
    };

    render () {
      global.manor = this.props;
      const { sortedTests, sortHeader, testForEdit, testForClone } = this.state;
      const { errorOnDeleteTest, history } = this.props;
      const noDataText = this.props.errorOnGetJobs ? errorMsgGetTests : this.loader();
      const columns = getColumns({
        columnsNames,
        onReportView: this.onReportView,
        onRawView: this.onRawView,
        onDelete: this.onDelete,
        onEdit: this.onEdit,
        onRunTest: this.onRunTest,
        onSort: this.onSort,
        sortHeader: sortHeader,
        onClone: this.onClone
      });
      const feedbackMsg = this.generateFeedbackMessage();
      const error = errorOnDeleteTest;
      return (
        <Page title={'Tests'} description={DESCRIPTION}>
          <Button className={style['create-button']} onClick={() => {
            this.setState({
              createTest: true
            });
          }}>Create Test</Button>
          <ReactTableComponent
            onSearch={this.onSearch}
            rowHeight={'46px'}
            manual={false}
            data={sortedTests}
            pageSize={10}
            columns={columns}
            noDataText={noDataText}
            resizable={false}
            cursor={'default'}
            // className={style.table}
          />

          {this.state.openViewTest
            ? <Dialog title_key={'id'} data={this.state.openViewTest}
              closeDialog={this.closeViewTestDialog} /> : null}
          {this.state.createTest &&
          <TestForm history={history} data={testForEdit || testForClone} closeDialog={this.closeCreateTest}
            cloneMode={!!testForClone} />}
          {(this.state.openViewCreateJob && !this.props.createJobSuccess)
            ? <JobForm data={this.state.openViewCreateJob} closeDialog={this.closeViewCreateJobDialog} /> : null}

          {(this.state.deleteDialog && !this.props.deleteTestSuccess)
            ? <DeleteDialog loader={this.props.processingDeleteTest}
              display={this.state.testToDelete ? this.state.testToDelete.name : ''}
              onSubmit={this.submitDelete} errorOnDelete={this.props.deleteError}
              onCancel={this.cancelDelete} /> : null}
          {feedbackMsg && <Snackbar
            open={!!feedbackMsg}
            bodyStyle={{ backgroundColor: '#2fbb67' }}
            message={feedbackMsg}
            autoHideDuration={4000}
            onRequestClose={this.handleSnackbarClose}
          />}
          {error && <ErrorDialog closeDialog={this.onCloseErrorDialog} showMessage={error} />}

        </Page>
      )
    }
}

function mapStateToProps (state) {
  return {
    tests: tests(state),
    test: test(state),
    processingGetTests: processingGetTests(state),
    errorOnGetTests: errorOnGetTests(state),
    errorOnGetTest: errorOnGetTest(state),
    createJobSuccess: createJobSuccess(state),
    processingDeleteTest: processingDeleteTest(state),
    deleteTestSuccess: deleteTestSuccess(state),
    errorOnDeleteTest: errorOnDeleteTest(state)
  }
}

const mapDispatchToProps = {
  clearSelectedTest: Actions.clearSelectedTest,
  clearSelectedJob: Actions.clearSelectedJob,
  clearErrorOnGetTests: Actions.clearErrorOnGetTests,
  getAllTests: Actions.getTests,
  // chooseTest: Actions.chooseTest,
  deleteTest: Actions.deleteTest,
  clearAllSuccessOperationsState: Actions.clearAllSuccessOperationsState,
  cleanAllErrors: Actions.cleanAllErrors
};

export default connect(mapStateToProps, mapDispatchToProps)(getTests);
