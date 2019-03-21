import React from 'react';
import { connect } from 'react-redux';
import Snackbar from 'material-ui/Snackbar';
import prettySeconds from 'pretty-seconds';
import { jobs, job, processingGetJobs, errorOnGetJobs, errorOnGetJob, processingDeleteJob, deleteJobSuccess } from './redux/selectors/jobsSelector';
import { tests } from './redux/selectors/testsSelector';
import { reports } from './redux/selectors/reportsSelector';
import { BootstrapTable, TableHeaderColumn, SearchField } from 'react-bootstrap-table';
import 'react-bootstrap-table/dist/react-bootstrap-table-all.min.css';
import style from './style.scss';
import Dialog from '../components/Dialog';
import DeleteDialog from '../components/DeleteDialog';
import * as Actions from './redux/action';
import Loader from '../components/Loader';
import classNames from 'classnames'
import Page from '../../../components/Page';
import { createCustomSearchField } from './utils';
import { getTimeFromCronExpr } from './utils';
const noDataMsg = 'There is no data to display.';
const errorMsgGetTests = 'Error occurred while trying to get all jobs.';
const REFRESH_DATA_INTERVAL = 30000;

class getJobs extends React.Component {
  constructor (props) {
    super(props);

    this.state = {
      openSnakeBar: false,
      deleteDialog: false,
      openViewJob: false,
      jobToDelete: undefined
    };
  }

    deleteFormatter = (cell, row) => {
      const classes = classNames('material-icons', style.deleteIcon, {
      });
      return (
        <i onClick={() => {
          this.setState({
            deleteDialog: true,
            jobToDelete: row
          })
        }} className={classes}>delete_forever</i>
      );
    };

    viewFormatter = (cell, row) => {
      return (
        <i onClick={() => {
          this.setState({ openViewJob: true });
          this.props.getJob(row.id);
        }} className='material-icons' style={{ color: '#2a3f53' }}>visibility</i>
      );
    };

    durationFormatter (cell, row) {
      return prettySeconds(Number(cell));
    }

    testNameFormatter = (cell, row) => {
      let test = this.props.tests.find((element) => {
        return element.id === row.test_id;
      });
      if (test) {
        return test.name;
      } else {
        return 'N/A';
      }
    };

    lastRunFormatter = (cell, row) => {
      let report = this.props.reports.find((element) => {
        return element.job_id === row.id;
      });
      if (report) {
        return report.start_time;
      } else {
        return 'N/A';
      }
    };
    cronFormatter = (cell, row) => {
      return getTimeFromCronExpr(row.cron_expression) || 'N/A'
    };

    submitDelete = () => {
      this.props.deleteJob(this.state.jobToDelete.id);
      this.props.getAllJobs();
      this.setState({
        deleteDialog: false
      });
    };

    clearDeleteError = () => {
      this.props.getAllJobs();
      this.props.clearErrorOnDelete();
    };

    cancelDelete = () => {
      this.setState({
        deleteDialog: false
      });

      this.props.deleteError ? this.clearDeleteError() : undefined
    };

    closeViewJobDialog = () => {
      this.setState({
        openViewJob: false
      });
      this.props.clearSelectedJob();
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

    componentDidMount () {
      this.loadPageData();
      this.refreshDataInterval = setInterval(this.loadPageData, REFRESH_DATA_INTERVAL)
    }

    loadPageData=() => {
      this.props.getTests();
      this.props.getAllReports();
      this.props.clearErrorOnGetJobs();
      this.props.getAllJobs();
    };

    componentWillUnmount () {
      this.props.clearErrorOnGetJobs();
      this.props.clearSelectedJob();
      clearInterval(this.refreshDataInterval);
    }

    loader () {
      return this.props.processingGetJobs ? <Loader /> : noDataMsg
    }

    render () {
      let options = {
        clearSearch: true,
        paginationPanel: this.renderPaginationPanel,
        noDataText: this.props.errorOnGetJobs ? errorMsgGetTests : this.loader(),
        searchField: createCustomSearchField
      };

      return (
        <Page title={'Scheduled Jobs'}>
          <div className={style.getTests}>
            <div className={style.tableDiv}>
              <BootstrapTable options={options} bodyContainerClass={style.container}
                tableStyle={{ height: 'auto !important' }} trClassName={style.row} pagination
                search
                editable
                data={this.props.jobs}
                striped hover>
                <TableHeaderColumn dataField='id' hidden isKey dataAlign='left' width={'175'}
                  dataSort>ID</TableHeaderColumn>
                <TableHeaderColumn dataFormat={this.testNameFormatter} width={'100'} tdStyle={{ whiteSpace: 'normal' }} thStyle={{ whiteSpace: 'normal' }}>Test Name</TableHeaderColumn>
                <TableHeaderColumn dataField='environment' width={'100'}>Environment</TableHeaderColumn>
                <TableHeaderColumn dataField='duration' dataFormat={this.durationFormatter} width={'100'} tdStyle={{ whiteSpace: 'normal' }} thStyle={{ whiteSpace: 'normal' }}>Duration</TableHeaderColumn>
                <TableHeaderColumn dataField='arrival_rate' width={'100'}>Arrival Rate</TableHeaderColumn>
                <TableHeaderColumn dataField='ramp_to' editable={{ type: 'text', defaultValue: 'N/A' }} width={'100'}>Ramp To</TableHeaderColumn>
                <TableHeaderColumn dataField='parallelism' editable={{ type: 'text', defaultValue: 'N/A' }} width={'100'}>Parallelism</TableHeaderColumn>
                <TableHeaderColumn dataField='max_virtual_users' editable={{ type: 'text', defaultValue: 'N/A' }} width={'100'}>Max Virtual Users</TableHeaderColumn>
                <TableHeaderColumn dataField='cron_expression' editable={{ type: 'text', defaultValue: 'N/A' }} width={'100'} dataFormat={this.cronFormatter}>Cron Expression</TableHeaderColumn>
                <TableHeaderColumn dataField='cron_expression' editable={{ type: 'text', defaultValue: 'N/A' }} width={'100'} dataFormat={this.lastRunFormatter}>Last Run</TableHeaderColumn>
                <TableHeaderColumn dataField='view' dataAlign='center' dataFormat={this.viewFormatter}
                  width={'50'} />
                <TableHeaderColumn dataField='delete' dataAlign='center'
                  dataFormat={this.deleteFormatter}
                  width={'50'} />
              </BootstrapTable>
            </div>

            {this.state.openViewJob
              ? <Dialog title_key={'id'} data={this.props.job} closeDialog={this.closeViewJobDialog} /> : null}

            {this.state.deleteDialog && !this.props.deleteJobSuccess
              ? <DeleteDialog loader={this.props.processingDeleteJob} display={this.state.jobToDelete ? `job ${this.state.jobToDelete.id}` : ''}
                onSubmit={this.submitDelete} errorOnDelete={this.props.deleteError}
                onCancel={this.cancelDelete} /> : null}

            <Snackbar
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'center'
              }}
              open={this.props.deleteJobSuccess}
              bodyStyle={{ backgroundColor: '#2fbb67' }}
              message={(this.state.jobToDelete && this.state.jobToDelete.id) ? `Job deleted successfully: ${this.state.jobToDelete.id}` : ''}
              autoHideDuration={4000}
              onRequestClose={() => {
                this.props.getAllJobs();
                this.props.clearDeleteJobSuccess();
                this.setState({
                  jobToDelete: undefined
                });
              }}
            />
          </div>
        </Page>
      )
    }
}

function mapStateToProps (state) {
  return {
    jobs: jobs(state),
    job: job(state),
    processingGetJobs: processingGetJobs(state),
    errorOnGetJobs: errorOnGetJobs(state),
    errorOnGetJob: errorOnGetJob(state),
    processingDeleteJob: processingDeleteJob(state),
    deleteJobSuccess: deleteJobSuccess(state),
    tests: tests(state),
    reports: reports(state)
  }
}

const mapDispatchToProps = {
  clearSelectedJob: Actions.clearSelectedJob,
  clearErrorOnGetJobs: Actions.clearErrorOnGetJobs,
  getAllJobs: Actions.getJobs,
  getJob: Actions.getJob,
  deleteJob: Actions.deleteJob,
  clearDeleteJobSuccess: Actions.clearDeleteJobSuccess,
  clearErrorOnDeleteJob: Actions.clearErrorOnDeleteJob,
  getTests: Actions.getTests,
  getAllReports: Actions.getLastReports
};

export default connect(mapStateToProps, mapDispatchToProps)(getJobs);
