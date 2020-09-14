import Page from "../components/Page";
import React, {useEffect} from "react";
import Report from "./components/Report";
import * as selectors from "./redux/selectors/reportsSelector";
import {createJobSuccess, errorOnStopRunningJob, stopRunningJobSuccess} from "./redux/selectors/jobsSelector";
import * as Actions from "./redux/action";
import {connect} from "react-redux";
import Loader from "./components/Loader";
import ErrorDialog from "./components/ErrorDialog";

const ReportPage = ({setGetReportFailure, error, loading, report, getReport, match: {params}}) => {
    const {testId, reportId} = params;
    useEffect(() => {
        getReport(testId, reportId);

    }, []);
    const onCloseErrorDialog = () => {

        setGetReportFailure(false);
    };

    return (
        <Page>
            {loading && <Loader/>}
            {report && <Report report={report}/>}
            {error && <ErrorDialog closeDialog={onCloseErrorDialog} showMessage={error}/>}
        </Page>
    )
};


function mapStateToProps(state) {
    return {
        loading: selectors.processingGetReport(state),
        report: selectors.report(state),
        error: selectors.errorOnGetReport(state),
    }
}

const mapDispatchToProps = {
    getReport: Actions.getReport,
    setGetReportFailure: Actions.getReportFailure,
};

export default connect(mapStateToProps, mapDispatchToProps)(ReportPage);


