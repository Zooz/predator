import axios from 'axios';
import env from '../../../../../App/common/env';

export const getReportsFromFramework = (queryParams, testId) => {
  let url = queryParams ? `CHANGE_ME_TO_EXTERNAL_ADDRESS/tests/${testId}/reports${queryParams}` : `CHANGE_ME_TO_EXTERNAL_ADDRESS/tests/${testId}/reports`;

  return axios.get(url, {
    headers: {
    }
  });
};

export const getReportFromFramework = (testId, runId) => {
  return axios.get(`CHANGE_ME_TO_EXTERNAL_ADDRESS/tests/${testId}/reports/${runId}`, {
    headers: {
    }
  });
};

export const getLastReportsFromFramework = (queryParams) => {
  queryParams = queryParams ? '?limit=50' : undefined; // TODO fix

  let url = queryParams ? `CHANGE_ME_TO_EXTERNAL_ADDRESS/tests/last_reports${queryParams}` : `CHANGE_ME_TO_EXTERNAL_ADDRESS/tests/last_reports?limit=50`;
  return axios.get(url, {
    headers: {
    }
  });
};
