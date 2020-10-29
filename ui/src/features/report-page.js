import Page from '../components/Page';
import React, { useEffect } from 'react';
import Report from './components/Report';
import * as selectors from './redux/selectors/reportsSelector';
import * as Actions from './redux/action';
import { connect } from 'react-redux';
import Loader from './components/Loader';
import ErrorDialog from './components/ErrorDialog';

const ReportPage = ({ clearSelectedReport, cleanAllReportsErrors, errorGetReport, errorEditReport, loading, report, getReport, match: { params } }) => {
  const error = errorGetReport || errorEditReport;
  useEffect(() => {
    return () => {
      clearSelectedReport();
    }
  }, [])

  useEffect(() => {
    const { testId, reportId } = params;
    let timeoutId;
    if (!report) {
      timeoutId = undefined;
      getReport(testId, reportId);
    } else if (!['failed', 'aborted', 'finished'].includes(report.status)) {
      timeoutId = setTimeout(function () {
        getReport(testId, reportId);
      }, 5000)
    }
    return () => {
      clearTimeout(timeoutId);
    }
  }, [report]);

  const onCloseErrorDialog = () => {
    cleanAllReportsErrors();
  };

  return (
    <Page>
      {loading && !report && <Loader />}
      {report && <Report report={report} />}
      {error && <ErrorDialog closeDialog={onCloseErrorDialog} showMessage={error} />}
    </Page>
  )
};

function mapStateToProps (state) {
  return {
    loading: selectors.processingGetReport(state),
    report: selectors.report(state),
    errorGetReport: selectors.errorOnGetReport(state),
    errorEditReport: selectors.editReportFailure(state)
  }
}

const mapDispatchToProps = {
  getReport: Actions.getReport,
  cleanAllReportsErrors: Actions.cleanAllReportsErrors,
  clearSelectedReport: Actions.clearSelectedReport
};

export default connect(mapStateToProps, mapDispatchToProps)(ReportPage);
