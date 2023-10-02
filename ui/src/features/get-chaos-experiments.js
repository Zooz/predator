import React from 'react';
import Snackbar from 'material-ui/Snackbar';
import { connect } from 'react-redux';
import * as Selectors from './redux/selectors/chaosExperimentsSelector';
import style from './style.scss';
import * as Actions from './redux/action';
import Loader from './components/Loader';
import DeleteDialog from './components/DeleteDialog';
import Page from '../components/Page';
import ChaosExperimentForm from './components/ChaosExperimentForm';
import { ReactTableComponent } from '../components/ReactTable';
import { getColumns } from './configurationColumn';
import Button from '../components/Button';
import _ from 'lodash';
import ErrorDialog from './components/ErrorDialog';
import Dialog from './components/Dialog';

const noDataMsg = 'There is no data to display.';
const errorMsgGetChaosExperiments = 'Error occurred while trying to get all chaos experiments.';
const columnsNames = ['experiment_name', 'created_at', 'kind', 'duration', 'raw', 'experiment_edit', 'delete'];
const DESCRIPTION = 'Create chaos experiments templates to be injected as part of your running test.';

class getChaosExperiments extends React.Component {
  constructor (props) {
    super(props);

    this.state = {
      openNewTestDialog: false,
      deleteDialog: false,
      chaosExperimentToDelete: undefined,
      chaosExperimentForEdit: undefined,
      createChaosExperiment: false,
      sortedChaosExperiments: [],
      sortHeader: ''
    };
  }

  componentDidUpdate (prevProps) {
    if (prevProps.chaosExperimentsList !== this.props.chaosExperimentsList) {
      this.setState({ sortedChaosExperiments: [...this.props.chaosExperimentsList], sortHeader: 'updated_at-' }, () => {
        this.onSort('updated_at');
      });
    }
  }

    onDelete = (data) => {
      this.setState({
        deleteDialog: true,
        chaosExperimentToDelete: data
      });
    }
    onSearch = (value) => {
      if (!value) {
        this.setState({ sortedChaosExperiments: [...this.props.chaosExperimentsList] });
      }
      const newSorted = _.filter(this.props.chaosExperimentsList, (chaosExperiment) => {
        return (
          _.includes(String(chaosExperiment.name).toLowerCase(), value.toLowerCase())
        );
      });
      this.setState({ sortedChaosExperiments: newSorted });
    };

    onSort = (field) => {
      const { sortHeader } = this.state;
      let isAsc = false;
      if (sortHeader.includes(field)) {
        isAsc = !sortHeader.includes('+');
      } else {
        isAsc = true;
      }
      let sortedReport;
      if (isAsc) {
        sortedReport = _.chain(this.state.sortedChaosExperiments).sortBy(field).reverse().value();
      } else {
        sortedReport = _.chain(this.state.sortedChaosExperiments).sortBy(field).value();
      }
      this.setState({ sortedChaosExperiments: sortedReport, sortHeader: `${field}${isAsc ? '+' : '-'}` });
    };

    submitDelete = () => {
      this.props.deleteChaosExperiment(this.state.chaosExperimentToDelete.id);
      this.setState({
        deleteDialog: false
      });
    };

    cancelDelete = () => {
      this.setState({
        deleteDialog: false
      });
    };

    onCreateExperiment = () => {
      this.setState({
        createChaosExperiment: true
      })
    }

  onEdit = (data) => {
    this.setState({ createChaosExperiment: true, chaosExperimentForEdit: data });
  };

  onRawView = (data) => {
    this.setState({ openViewExperiment: data.kubeObject });
  };

  closeExperimentDialog = () => {
    this.setState({
      openViewExperiment: false,
      createChaosExperiment: false,
      chaosExperimentForEdit: null,
      chaosExperimentForView: null
    });
  }

    handleSnackbarClose = () => {
      this.props.setDeleteChaosExperimentSuccess(false);
      this.setState({
        chaosExperimentToDelete: undefined
      });
    };

    loader () {
      return this.props.choasExperimentsLoading && this.props.chaosExperimentsList && this.props.chaosExperimentsList.length === 0
        ? <Loader /> : noDataMsg;
    }

    componentDidMount () {
      this.props.getChaosExperiments();
    }
    onCloseErrorDialog=() => {
      this.props.cleanAllErrors()
      this.props.cleanAllErrors();
    };
    render () {
      const { sortedChaosExperiments, sortHeader } = this.state;
      const noDataText = this.props.chaosExperimentFailure ? errorMsgGetChaosExperiments : this.loader();
      const columns = getColumns({
        columnsNames,
        onReportView: this.onReportView,
        onRawView: this.onRawView,
        onEdit: this.onEdit,
        onDelete: this.onDelete,
        onRunTest: this.onRunTest,
        onSort: this.onSort,
        sortHeader: sortHeader
      });
      const error = this.props.chaosExperimentFailure || this.props.deleteChaosExperimentFailure;
      return (
        <Page title={'Chaos Experiments'} description={DESCRIPTION}>
          <Button
            className={style['create-button']}
            onClick={this.onCreateExperiment}>Create Experiment</Button>
          <ReactTableComponent
            onSearch={this.onSearch}
            rowHeight={'46px'}
            manual={false}
            data={sortedChaosExperiments}
            pageSize={10}
            columns={columns}
            noDataText={noDataText}
            showPagination
            resizable={false}
            cursor={'default'}
            // className={style.table}
          />

          {this.state.openViewExperiment
            ? <Dialog title_key={'name'} data={this.state.openViewExperiment}
              closeDialog={this.closeExperimentDialog} /> : null}

          {this.state.createChaosExperiment &&
            <ChaosExperimentForm
              closeDialog={this.closeExperimentDialog}
              chaosExperimentForEdit={this.state.chaosExperimentForEdit} />}

          {(this.state.deleteDialog && !this.props.deleteChaosExperimentSuccess)
            ? <DeleteDialog loader={this.props.processingDeleteTest}
              display={this.state.chaosExperimentToDelete ? this.state.chaosExperimentToDelete.name : ''}
              onSubmit={this.submitDelete}
              onCancel={this.cancelDelete} /> : null}
          <Snackbar
            open={this.props.deleteChaosExperimentSuccess}
            bodyStyle={{ backgroundColor: '#2fbb67' }}
            message={'Chaos experiment deleted successfully'}
            autoHideDuration={4000}
            onRequestClose={this.handleSnackbarClose}
          />
          {error && <ErrorDialog closeDialog={this.onCloseErrorDialog} showMessage={error} />}

        </Page>
      );
    }
}

function mapStateToProps (state) {
  return {
    chaosExperimentsList: Selectors.chaosExperimentsList(state),
    deleteChaosExperimentSuccess: Selectors.deleteChaosExperimentSuccess(state),
    chaosExperimentsLoading: Selectors.chaosExperimentsLoading(state),
    chaosExperimentFailure: Selectors.chaosExperimentFailure(state),
    deleteChaosExperimentFailure: Selectors.deleteChaosExperimentFailure(state)
  };
}

const mapDispatchToProps = {
  getChaosExperiments: Actions.getChaosExperiments,
  deleteChaosExperiment: Actions.deleteChaosExperiment,
  setDeleteChaosExperimentSuccess: Actions.deleteChaosExperimentSuccess,
  getChaosExperimentsFailure: Actions.getChaosExperimentsFailure,
  cleanAllErrors: Actions.cleanAllChaosExperimentsErrors
};

export default connect(mapStateToProps, mapDispatchToProps)(getChaosExperiments);
