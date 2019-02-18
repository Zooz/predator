import React from 'react';
import Snackbar from 'material-ui/Snackbar';
import RaisedButton from 'material-ui/RaisedButton';
import { connect } from 'react-redux';
import {
  tests,
  test,
  processingGetTests,
  errorOnGetTests,
  errorOnGetTest,
  processingDeleteTest,
  deleteTestSuccess
} from './redux/selectors/testsSelector';
import { createJobSuccess } from './redux/selectors/jobsSelector';
import classNames from 'classnames'
import { BootstrapTable, TableHeaderColumn, SearchField } from 'react-bootstrap-table';
import 'react-bootstrap-table/dist/react-bootstrap-table-all.min.css';
import style from './style.scss';
import Moment from 'moment';
import Dialog from '../components/Dialog';
import InputDialog from '../components/InputDialog';
import JobForm from '../components/JobForm';
import * as Actions from './redux/action';
import Loader from '../components/Loader';
import history from '../../../store/history'
import DeleteDialog from '../components/DeleteDialog';
import Page from '../../../components/Page';
import { sortDates, createCustomSearchField } from './utils';
import TestForm from '../components/TestForm';
const timePattern = 'DD-MM-YYYY hh:mm:ss a';
const noDataMsg = 'There is no data to display.';
const errorMsgGetTests = 'Error occurred while trying to get all tests.';

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
      testForEdit: null
    }
  }

    deleteFormatter = (cell, row) => {
      const classes = classNames('material-icons', style.deleteIcon, {});
      return (
        <i onClick={() => {
          this.setState({
            deleteDialog: true,
            testToDelete: row
          })
        }} className={classes}>delete_forever</i>
      );
    };

    submitDelete = () => {
      this.props.deleteTest(this.state.testToDelete.id);
      this.props.getAllTests();
      this.setState({
        deleteDialog: false
      });
    };

    clearDeleteError = () => {
      this.props.getAllTests();
      this.props.clearErrorOnDelete();
    };

    cancelDelete = () => {
      this.setState({
        deleteDialog: false
      });

      this.props.deleteError ? this.clearDeleteError() : undefined
    };
    /* formatters */

    viewFormatter = (cell, row) => {
      return (
        <i onClick={() => {
          this.setState({ openViewTest: true });
          this.props.chooseTest(row);
        }} className='material-icons' style={{ color: '#2a3f53' }}>visibility</i>
      );
    };

  editFormatter = (cell, row) => {
    if (row.type === 'custom') {
      return (
          <i onClick={() => {
            this.setState({createTest: true, testForEdit: row});
            this.props.chooseTest(row);
          }} className='material-icons' style={{color: '#2a3f53'}}>edit</i>
      );
    }
  };

    dateFormatter = (value) => {
      return (
        new Moment(value).local().format(timePattern)
      );
    };

    reportFormatter = (cell, row) => {
      return (
        <RaisedButton primary className={style.button} onClick={() => {
          history.push(`/tests/${row.id}/reports`)
        }} label='View' />
      );
    };

    runJobFormatter = (cell, row) => {
      return (
        <RaisedButton primary className={style.button} onClick={() => {
          this.setState({
            openViewCreateJob: true
          });
          this.props.chooseTest(row);
        }} label='Run' />
      );
    };

    /* end formatters */

    /* views */

    closeViewTestDialog = () => {
      this.setState({
        openViewTest: false
      });
      this.props.clearSelectedTest();
    };
  closeCreateTest = () => {
    this.setState({
      createTest: false,
      testForEdit: null
    });
  };

    closeViewCreateJobDialog = () => {
      this.setState({
        openViewCreateJob: false
      });
      this.props.clearSelectedTest();
    };

    renderPaginationPanel = (props) => {
      return (
        <div className={style.pagination}>
          <div>{props.components.pageList}</div>
          <div>
            {props.components.sizePerPageDropdown}
          </div>
        </div>
      );
    };

    handleSnackbarClose = () => {
      this.props.getAllTests();
      this.props.clearSelectedJob();
      this.props.clearSelectedTest();
      this.props.clearDeleteTestSuccess();
      this.setState({
        testToDelete: undefined
      });
    };

    /* end views */

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

    render () {
      let options = {
        clearSearch: true,
        paginationPanel: this.renderPaginationPanel,
        noDataText: this.props.errorOnGetTests ? errorMsgGetTests : this.loader(),
        searchField: createCustomSearchField,
        defaultSortName: 'updated_at',
        defaultSortOrder: 'desc'
      };

      return (
        <Page title={'Tests'}>
          <div className={style.getTests}>
            <div className={style.tableDiv}>
              <RaisedButton primary className={style.button} onClick={() => {
                this.setState({
                  createTest: true
                });
              }} label='Create Test' />
              <BootstrapTable options={options} bodyContainerClass={style.container}
                tableStyle={{ height: 'auto !important' }} trClassName={style.row} pagination
                search
                data={this.props.tests}
                striped hover>
                <TableHeaderColumn dataField='id' isKey hidden dataAlign='left' width={'150'}>Test
                                ID</TableHeaderColumn>
                <TableHeaderColumn dataField='name' width={'80'} filterFormatted
                  tdStyle={{ whiteSpace: 'normal' }}
                  thStyle={{ whiteSpace: 'normal' }}>Name</TableHeaderColumn>
                <TableHeaderColumn dataField='description' width={'200'} filterFormatted
                  tdStyle={{ whiteSpace: 'normal' }}
                  thStyle={{ whiteSpace: 'normal' }}>Description</TableHeaderColumn>
                <TableHeaderColumn dataField='updated_at' width={'100'} dataAlign='left'
                  dataFormat={this.dateFormatter} dataSort sortFunc={sortDates}>Last
                                modified</TableHeaderColumn>
                <TableHeaderColumn dataField='type' width={'75'} dataAlign='left'>Type</TableHeaderColumn>
                <TableHeaderColumn width={'75'} dataAlign='left' dataFormat={this.runJobFormatter}>Run
                                test</TableHeaderColumn>
                <TableHeaderColumn dataField='report' width={'75'} dataAlign='left'
                  dataFormat={this.reportFormatter}>Reports</TableHeaderColumn>
                <TableHeaderColumn dataField='edit' dataAlign='center' dataFormat={this.editFormatter}
                  width={'25'} />
                <TableHeaderColumn dataField='view' dataAlign='center' dataFormat={this.viewFormatter}
                  width={'25'} />
                <TableHeaderColumn dataField='delete' dataAlign='center'
                  dataFormat={this.deleteFormatter}
                  width={'25'} />
              </BootstrapTable>
            </div>

            {this.state.openViewTest
              ? <Dialog title_key={'id'} data={this.props.test} closeDialog={this.closeViewTestDialog} /> : null}
            {this.state.createTest && <TestForm data={this.state.testForEdit} closeDialog={this.closeCreateTest} />}
            {/* TODO fix open dialog! */}
            {(this.state.openViewCreateJob && !this.props.createJobSuccess)// TODO what is this niv title?
              ? <InputDialog input={<JobForm />} history={history}
                title={'Create new job'} data={this.props.test}
                closeDialog={this.closeViewCreateJobDialog} /> : null}

            {(this.state.deleteDialog && !this.props.deleteTestSuccess)
              ? <DeleteDialog loader={this.props.processingDeleteTest}
                display={this.state.testToDelete ? this.state.testToDelete.name : ''}
                onSubmit={this.submitDelete} errorOnDelete={this.props.deleteError}
                onCancel={this.cancelDelete} /> : null}
            {/* TODO snack bar is common to al; page, need to extract it
                    fix using redux to be with less variables.
                  */}
            <Snackbar
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'center'
              }}
              open={this.props.createJobSuccess || this.props.deleteTestSuccess}
              bodyStyle={{ backgroundColor: '#2fbb67' }}
              message={(this.props.createJobSuccess && this.props.createJobSuccess.run_id) ? `Job created successfully with Run ID: ${this.props.createJobSuccess.run_id}` : 'Test deleted successfully'}
              autoHideDuration={4000}
              onRequestClose={this.handleSnackbarClose}
            />
          </div>
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
    deleteTestSuccess: deleteTestSuccess(state)
  }
}

const mapDispatchToProps = {
  clearSelectedTest: Actions.clearSelectedTest,
  clearSelectedJob: Actions.clearSelectedJob,
  clearErrorOnGetTests: Actions.clearErrorOnGetTests,
  getAllTests: Actions.getTests,
  chooseTest: Actions.chooseTest,
  deleteTest: Actions.deleteTest,
  clearDeleteTestSuccess: Actions.clearDeleteTestSuccess
};

export default connect(mapStateToProps, mapDispatchToProps)(getTests);
