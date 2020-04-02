import axios from 'axios';
import env from '../../../App/common/env';
import {getAuthorizationHeader} from './apiUtils';

export const getReportsFromFramework = (queryParams, testId) => {
  let url = queryParams ? `${env.PREDATOR_URL}/tests/${testId}/reports${queryParams}` : `${env.PREDATOR_URL}/tests/${testId}/reports`;

  return axios.get(url, {
    headers: getAuthorizationHeader()
  });
};

export const getReportFromFramework = (testId, runId) => {
  return axios.get(`${env.PREDATOR_URL}/tests/${testId}/reports/${runId}`, {
    headers: getAuthorizationHeader()
  });
};

export const getAggregateFromFramework = (testId,reportId) => {
  return axios.get(`${env.PREDATOR_URL}/tests/${testId}/reports/${reportId}/aggregate`, {
    headers: getAuthorizationHeader()
  });
};

export const getLastReportsFromFramework = () => {

  const url = `${env.PREDATOR_URL}/tests/last_reports?limit=200`;
  return axios.get(url, {
    headers: getAuthorizationHeader()
  });
};

export const createBenchmarkFromFramework = (testId, body) => {
  const url = `${env.PREDATOR_URL}/tests/${testId}/bench_mark`;
  return axios.post(url, body, {
    headers: getAuthorizationHeader()
  });
};

export const editReportFromFramework = (testId,reportId, body) => {
  const url = `${env.PREDATOR_URL}/tests/${testId}/reports/${reportId}`;
  return axios.put(url, body, {
    headers: getAuthorizationHeader()
  });
};
