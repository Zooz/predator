import axios from 'axios';
import env from '../../../../../App/common/env';

export const getReportsFromFramework = (queryParams, testId) => {
  let url = queryParams ? `${env.PERFORMANCE_FRAMEWORK_API_URL}/tests/${testId}/reports${queryParams}` : `${env.PERFORMANCE_FRAMEWORK_API_URL}/tests/${testId}/reports`;

  return axios.get(url, {
    headers: {
    }
  });
};

export const getReportFromFramework = (testId, runId) => {
  return axios.get(`${env.PERFORMANCE_FRAMEWORK_API_URL}/tests/${testId}/reports/${runId}`, {
    headers: {
    }
  });
};

export const getLastReportsFromFramework = (queryParams) => {
  queryParams = queryParams ? '?limit=50' : undefined; // TODO fix

  let url = queryParams ? `${env.PERFORMANCE_FRAMEWORK_API_URL}/tests/last_reports${queryParams}` : `${env.PERFORMANCE_FRAMEWORK_API_URL}/tests/last_reports?limit=50`;
  return axios.get(url, {
    headers: {
    }
  });
};
