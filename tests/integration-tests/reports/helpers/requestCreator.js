'use strict';

const request = require('supertest');
const appInitUtils = require('../../testUtils');

let testApp;

module.exports = {
    init,
    postStats,
    getReport,
    deleteReport,
    getReports,
    editReport,
    getLastReports,
    getAggregatedReport,
    getExportedReport,
    getExportedCompareReport,
    subscribeRunnerToReport
};

async function init() {
    testApp = await appInitUtils.getCreateTestApp();
}

function postStats(testId, reportId, body, headers = { 'Content-Type': 'application/json' }) {
    return request(testApp).post(`/v1/tests/${testId}/reports/${reportId}/stats`)
        .send(body)
        .set(headers);
}

function editReport(testId, reportId, body, headers = { 'Content-Type': 'application/json' }) {
    return request(testApp).put(`/v1/tests/${testId}/reports/${reportId}`)
        .send(body)
        .set(headers);
}

function getAggregatedReport(testId, reportId, headers = { 'Content-Type': 'application/json' }) {
    return request(testApp).get(`/v1/tests/${testId}/reports/${reportId}/aggregate`)
        .set(headers);
}

function getReport(testId, reportId, headers = { 'Content-Type': 'application/json' }) {
    return request(testApp).get(`/v1/tests/${testId}/reports/${reportId}`)
        .set(headers);
}

function getExportedReport(testId, reportId, fileFormat, headers = { 'Content-Type': 'application/json' }) {
    return request(testApp).get(`/v1/tests/${testId}/reports/${reportId}/export/${fileFormat}`)
        .set(headers)
        .expect(function (res) {
            return res;
        });
}
function getExportedCompareReport(fileFormat, reportMetaData, headers = { 'Content-Type': 'application/json' }) {
    let url = `/v1/tests/reports/compare/export/${fileFormat}`;
    let reportIdsAsCSV = "";
    let testIdsAsCSV = "";
    for (let index = 0; index < reportMetaData.report_ids.length; index++){
        reportIdsAsCSV+=reportMetaData["report_ids"][index];
        testIdsAsCSV+=reportMetaData["test_ids"][index];
        if (index < reportMetaData.report_ids.length -1){
            reportIdsAsCSV+=",";
            testIdsAsCSV+=",";
        }
    }
    let request_string = "report_ids="+reportIdsAsCSV+"&test_ids="+testIdsAsCSV;
    return request(testApp).get(url+"?"+request_string)
        .set(headers)
        .expect(function (res) {
            return res;
        });
}

function deleteReport(testId, reportId, headers = { 'Content-Type': 'application/json' }) {
    return request(testApp).delete(`/v1/tests/${testId}/reports/${reportId}`)
        .set(headers);
}

function getReports(testId, filter, headers = { 'Content-Type': 'application/json' }) {
    let url = `/v1/tests/${testId}/reports`;
    if (filter) {
        url += `?filter=${filter}`;
    }
    return request(testApp).get(url)
        .set(headers);
}

function getLastReports(limit, filter, headers = { 'Content-Type': 'application/json' }) {
    let url = `/v1/tests/last_reports?limit=${limit}`;
    if (filter) {
        url += `&filter=${filter}`;
    }
    return request(testApp).get(url)
        .set(headers);
}

async function subscribeRunnerToReport(testId, reportId, runnerId, headers = { 'Content-Type': 'application/json' }) {
    return request(testApp)
        .post(`/v1/tests/${testId}/reports/${reportId}/subscribe`)
        .set({ ...headers, 'x-runner-id': runnerId })
        .send({});
}
