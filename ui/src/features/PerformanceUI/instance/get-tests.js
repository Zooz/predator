import React from 'react';
import Snackbar from 'material-ui/Snackbar';
import {connect} from 'react-redux';
import {
    tests,
    test,
    processingGetTests,
    errorOnGetTests,
    errorOnGetTest,
    processingDeleteTest,
    deleteTestSuccess
} from './redux/selectors/testsSelector';
import {createJobSuccess} from './redux/selectors/jobsSelector';
import style from './style.scss';
import Dialog from '../components/Dialog';
import JobForm from '../components/JobForm';
import * as Actions from './redux/action';
import Loader from '../components/Loader';
import history from '../../../store/history'
import DeleteDialog from '../components/DeleteDialog';
import Page from '../../../components/Page';
import TestForm from '../components/TestForm';
import {ReactTableComponent} from "../../../components/ReactTable";
import {getColumns} from "./configurationColumn";
import Button from '../../../components/Button';
import _ from "lodash";


const noDataMsg = 'There is no data to display.';
const errorMsgGetTests = 'Error occurred while trying to get all tests.';
const columnsNames = ['name', 'description', 'updated_at', 'type', 'run_test','report', 'edit', 'raw', 'delete'];
const DESCRIPTION = 'Tests include end-to-end scenarios that are executed at pre-configured intervals to provide in-depth performance metrics of your API.';

class getTests extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            openViewTest: false,
            openViewCreateJob: false,
            openNewTestDialog: false,
            deleteDialog: false,
            testToDelete: undefined,
            createTest: false,
            testForEdit: null,
            sortedTests: []
        }
    }

    componentDidUpdate(prevProps) {
        if (prevProps.tests !== this.props.tests) {
            this.setState({sortedTests: [...this.props.tests]})
        }
    }


    onDelete= (data)=>{
        this.setState({
            deleteDialog: true,
            testToDelete: data
        })
    }
    onSearch = (value) => {
        if (!value) {
            this.setState({sortedTests: [...this.props.tests]})
        }
        const newSorted = _.filter(this.props.tests, (test) => {
            return (
                _.includes(String(test.name).toLowerCase(),value.toLowerCase()) ||
                _.includes(String(test.type).toLowerCase(),value.toLowerCase()) ||
                _.includes(String(test.description).toLowerCase(),value.toLowerCase())
            )

        });
        this.setState({sortedTests: newSorted})
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

    onRawView = (data) => {
        this.setState({openViewTest: data});

    };

    onEdit = (data)=>{
        this.setState({createTest: true, testForEdit: data});
        this.props.chooseTest(data);
    };

    onReportView=(data)=>{
        history.push(`/tests/${data.id}/reports`)
    };

    onRunTest=(data)=>{
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


    handleSnackbarClose = () => {
        this.props.getAllTests();
        this.props.clearSelectedJob();
        this.props.clearSelectedTest();
        this.props.clearDeleteTestSuccess();
        this.setState({
            testToDelete: undefined
        });
    };

    loader() {
        return this.props.processingGetTests ? <Loader/> : noDataMsg
    }

    componentDidMount() {
        this.props.clearErrorOnGetTests();
        this.props.getAllTests();
    }

    componentWillUnmount() {
        this.props.clearErrorOnGetTests();
        this.props.clearSelectedTest();
    }

    componentWillReceiveProps() {
        if (this.props.createJobSuccess) {
            this.setState({
                openViewCreateJob: false
            });
        }
    }

    render() {
        const {sortedTests} = this.state;
        const noDataText = this.props.errorOnGetJobs ? errorMsgGetTests : this.loader();
        const columns = getColumns({
            columnsNames,
            onReportView: this.onReportView,
            onRawView: this.onRawView,
            onDelete: this.onDelete,
            onEdit: this.onEdit,
            onRunTest: this.onRunTest
        });

        return (
            <Page title={'Tests'} description={DESCRIPTION}>
                <Button className={style['create-button']} onClick={() => {
                    this.setState({
                        createTest: true
                    });
                }}>CREATE TEST</Button>
                <ReactTableComponent
                    onSearch={this.onSearch}
                    rowHeight={'46px'}
                    manual={false}
                    data={sortedTests}
                    pageSize={10}
                    columns={columns}
                    noDataText={noDataText}
                    showPagination
                    resizable={false}
                    cursor={'default'}
                    // className={style.table}
                />

                    {this.state.openViewTest
                        ?
                        <Dialog title_key={'id'} data={this.state.openViewTest} closeDialog={this.closeViewTestDialog}/> : null}
                    {this.state.createTest &&
                    <TestForm data={this.state.testForEdit} closeDialog={this.closeCreateTest}/>}
                    {(this.state.openViewCreateJob && !this.props.createJobSuccess)
                        ? <JobForm data={this.state.openViewCreateJob} closeDialog={this.closeViewCreateJobDialog}/> : null}


                    {(this.state.deleteDialog && !this.props.deleteTestSuccess)
                        ? <DeleteDialog loader={this.props.processingDeleteTest}
                                        display={this.state.testToDelete ? this.state.testToDelete.name : ''}
                                        onSubmit={this.submitDelete} errorOnDelete={this.props.deleteError}
                                        onCancel={this.cancelDelete}/> : null}
                    {/* TODO snack bar is common to al; page, need to extract it
                    fix using redux to be with less variables.
                  */}
                    <Snackbar
                        anchorOrigin={{
                            vertical: 'top',
                            horizontal: 'center'
                        }}
                        open={this.props.createJobSuccess || this.props.deleteTestSuccess}
                        bodyStyle={{backgroundColor: '#2fbb67'}}
                        message={(this.props.createJobSuccess && this.props.createJobSuccess.run_id) ? `Job created successfully with Run ID: ${this.props.createJobSuccess.run_id}` : 'Test deleted successfully'}
                        autoHideDuration={4000}
                        onRequestClose={this.handleSnackbarClose}
                    />
            </Page>
        )
    }
}

function mapStateToProps(state) {
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
