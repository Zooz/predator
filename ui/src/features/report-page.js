import Page from "../components/Page";
import React, {useEffect} from "react";
import Report from "./components/Report";
import * as selectors from "./redux/selectors/reportsSelector";
import {createJobSuccess, errorOnStopRunningJob, stopRunningJobSuccess} from "./redux/selectors/jobsSelector";
import * as Actions from "./redux/action";
import {connect} from "react-redux";

const DESCRIPTION = 'asdasdasd';
/*
* todo
*  loading
* error handler
* feedback?
*
* */

const ReportPage = ({report,getReport, match: {params}}) => {

    // const {match: {params}} = props;

    const {testId,reportId}  = params;
    useEffect(() => {
        getReport(testId,reportId);

    },[]);


    return (
        <Page>
            {report && <Report report={report}/>}

        </Page>
    )

}


function mapStateToProps(state) {
    return {
        report: selectors.report(state),
    }
}

const mapDispatchToProps = {
    getReport: Actions.getReport,
};

export default connect(mapStateToProps, mapDispatchToProps)(ReportPage);


