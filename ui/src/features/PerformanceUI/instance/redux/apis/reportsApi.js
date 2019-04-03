import axios from 'axios';
import env from '../../../../../App/common/env';
import {getHeaders} from './apiUtils';

export const getReportsFromFramework = (queryParams, testId) => {
  let url = queryParams ? `${env.PREDATOR_URL}/tests/${testId}/reports${queryParams}` : `${env.PREDATOR_URL}/tests/${testId}/reports`;

  return axios.get(url, {
    headers: getHeaders()
  });
};

export const getReportFromFramework = (testId, runId) => {
  return axios.get(`${env.PREDATOR_URL}/tests/${testId}/reports/${runId}`, {
    headers: getHeaders()
  });
};

export const getAggregateFromFramework = (testId,reportId) => {
  return axios.get(`${env.PREDATOR_URL}/tests/${testId}/reports/${reportId}/aggregate`, {
    headers: getHeaders()
  });
};

export const getLastReportsFromFramework = () => {

  let url = `${env.PREDATOR_URL}/tests/last_reports?limit=200`;
  return axios.get(url, {
    headers: getHeaders()
  });
};
