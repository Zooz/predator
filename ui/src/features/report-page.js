import Page from "../components/Page";
import React, {useEffect} from "react";
import Report from "./components/Report";
import * as selectors from "./redux/selectors/reportsSelector";
import * as Actions from "./redux/action";
import {connect} from "react-redux";
import Loader from "./components/Loader";
import ErrorDialog from "./components/ErrorDialog";

const ReportPage = ({cleanAllReportsErrors, errorGetReport, errorEditReport, loading, report, getReport, match: {params}}) => {
    const {testId, reportId} = params;
    const error = errorGetReport || errorEditReport;
    useEffect(() => {
        getReport(testId, reportId);

    }, []);
    const onCloseErrorDialog = () => {
        cleanAllReportsErrors();
    };

    return (
        <Page>
            {loading && !report && <Loader/>}
            {report && <Report report={report}/>}
            {error && <ErrorDialog closeDialog={onCloseErrorDialog} showMessage={error}/>}
        </Page>
    )
};


function mapStateToProps(state) {
    return {
        loading: selectors.processingGetReport(state),
        report: selectors.report(state),
        errorGetReport: selectors.errorOnGetReport(state),
        errorEditReport: selectors.editReportFailure(state),
    }
}

const mapDispatchToProps = {
    getReport: Actions.getReport,
    cleanAllReportsErrors: Actions.cleanAllReportsErrors,
};

export default connect(mapStateToProps, mapDispatchToProps)(ReportPage);


