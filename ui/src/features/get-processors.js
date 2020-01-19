import React from 'react';
import Snackbar from 'material-ui/Snackbar';
import { connect } from 'react-redux';
import * as Selectors from './redux/selectors/processorsSelector';
import style from './style.scss';
import * as Actions from './redux/action';
import Loader from './components/Loader';
import DeleteDialog from './components/DeleteDialog';
import Page from '../components/Page';
import ProcessorForm from './components/ProcessorForm';
import { ReactTableComponent } from '../components/ReactTable';
import { getColumns } from './configurationColumn';
import Button from '../components/Button';
import _ from 'lodash';

/*
*  TODO and error handling for delete processor
*
* */
const noDataMsg = 'There is no data to display.';
const errorMsgGetProcessors = 'Error occurred while trying to get all processors.';
const columnsNames = ['processor_name', 'description', 'updated_at', 'processor_edit', 'delete'];
const DESCRIPTION = 'Processors inject custom JavaScript into test flows, allowing the flow to be as flexible as possible.';

class getProcessors extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            openNewTestDialog: false,
            deleteDialog: false,
            processorToDelete: undefined,
            createProcessor: false,
            processorForEdit: null,
            sortedProcessors: [],
            sortHeader: ''
        };
    }

    componentDidUpdate(prevProps) {
        if (prevProps.processorsList !== this.props.processorsList) {
            this.setState({ sortedProcessors: [...this.props.processorsList], sortHeader: 'updated_at-' }, () => {
                this.onSort('updated_at');
            });
        }
    }

    onDelete = (data) => {
        this.setState({
            deleteDialog: true,
            processorToDelete: data
        });
    }
    onSearch = (value) => {
        if (!value) {
            this.setState({ sortedProcessors: [...this.props.processorsList] });
        }
        const newSorted = _.filter(this.props.processorsList, (processor) => {
            return (
                _.includes(String(processor.name).toLowerCase(), value.toLowerCase()) ||
                _.includes(String(processor.description).toLowerCase(), value.toLowerCase())
            );
        });
        this.setState({ sortedProcessors: newSorted });
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
            sortedReport = _.chain(this.state.sortedProcessors).sortBy(field).reverse().value();
        } else {
            sortedReport = _.chain(this.state.sortedProcessors).sortBy(field).value();
        }
        this.setState({ sortedProcessors: sortedReport, sortHeader: `${field}${isAsc ? '+' : '-'}` });
    };

    submitDelete = () => {
        this.props.deleteProcessor(this.state.processorToDelete.id);
        this.setState({
            deleteDialog: false
        });
    };

    cancelDelete = () => {
        this.setState({
            deleteDialog: false
        });
    };

    onEdit = (data) => {
        this.setState({ createProcessor: true, processorForEdit: data });
    };

    closeCreateTest = () => {
        this.setState({
            createProcessor: false,
            processorForEdit: null
        });
    };

    handleSnackbarClose = () => {
        this.props.setDeleteProcessorSuccess(false);
        this.setState({
            processorToDelete: undefined
        });
    };

    loader() {
        return this.props.processorLoading && this.props.processorsList && this.props.processorsList.length === 0
            ? <Loader /> : noDataMsg;
    }

    componentDidMount() {
        this.props.getProcessors();
    }

    render() {
        const { sortedProcessors, sortHeader } = this.state;
        const noDataText = this.props.processorFailure ? errorMsgGetProcessors : this.loader();
        const columns = getColumns({
            columnsNames,
            onReportView: this.onReportView,
            onRawView: this.onRawView,
            onDelete: this.onDelete,
            onEdit: this.onEdit,
            onRunTest: this.onRunTest,
            onSort: this.onSort,
            sortHeader: sortHeader
        });
        return (
            <Page title={'Processors'} description={DESCRIPTION}>
            <Button className={style['create-button']} onClick={() => {
                    this.setState({
                        createProcessor: true
                    });
                }}>Create Processor</Button>
            <ReactTableComponent
                onSearch={this.onSearch}
                    rowHeight={'46px'}
                    manual={false}
                    data={sortedProcessors}
                    pageSize={10}
                    columns={columns}
                    noDataText={noDataText}
                    showPagination
                    resizable={false}
                    cursor={'default'}
                    // className={style.table}
                />

            {this.state.createProcessor &&
                <ProcessorForm data={this.state.processorForEdit} closeDialog={this.closeCreateTest} />}

                {(this.state.deleteDialog && !this.props.deleteProcessorSuccess)
                    ? <DeleteDialog loader={this.props.processingDeleteTest}
                      display={this.state.processorToDelete ? this.state.processorToDelete.name : ''}
                      onSubmit={this.submitDelete}
                      onCancel={this.cancelDelete} /> : null}
                <Snackbar
                    open={this.props.deleteProcessorSuccess}
                    bodyStyle={{ backgroundColor: '#2fbb67' }}
                    message={'Processor deleted successfully'}
                    autoHideDuration={4000}
                    onRequestClose={this.handleSnackbarClose}
                />
          </Page>
        );
    }
}

function mapStateToProps(state) {
    return {
        processorsList: Selectors.processorsList(state),
        deleteProcessorSuccess: Selectors.deleteProcessorSuccess(state),
        processorLoading: Selectors.processorsLoading(state),
        processorFailure: Selectors.processorFailure(state),
    };
}

const mapDispatchToProps = {
    getProcessors: Actions.getProcessors,
    deleteProcessor: Actions.deleteProcessor,
    setDeleteProcessorSuccess: Actions.deleteProcessorSuccess,
    getProcessorsFailure: Actions.getProcessorsFailure
};

export default connect(mapStateToProps, mapDispatchToProps)(getProcessors);
