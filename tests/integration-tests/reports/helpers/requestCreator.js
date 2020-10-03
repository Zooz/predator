'use strict';

const request = require('supertest');

const app = require('../../../../src/app');

let testApp;
const HEADERS = { 'Content-Type': 'application/json' };

module.exports = {
    init,
    postStats,
    getReport,
    deleteReport,
    getReports,
    editReport,
    getLastReports,
    getAggregatedReport,
    subscribeRunnerToReport
};

async function init() {
    testApp = await app();
}

function postStats(testId, reportId, body) {
    return request(testApp).post(`/v1/tests/${testId}/reports/${reportId}/stats`)
        .send(body)
        .set(HEADERS)
        .expect(function (res) {
            return res;
        });
}

function editReport(testId, reportId, body) {
    return request(testApp).put(`/v1/tests/${testId}/reports/${reportId}`)
        .send(body)
        .set(HEADERS)
        .expect(function (res) {
            return res;
        });
}

function getAggregatedReport(testId, reportId) {
    return request(testApp).get(`/v1/tests/${testId}/reports/${reportId}/aggregate`)
        .set(HEADERS)
        .expect(function (res) {
            return res;
        });
}

function getReport(testId, reportId) {
    return request(testApp).get(`/v1/tests/${testId}/reports/${reportId}`)
        .set(HEADERS)
        .expect(function (res) {
            return res;
        });
}

function deleteReport(testId, reportId) {
    return request(testApp).delete(`/v1/tests/${testId}/reports/${reportId}`)
        .set(HEADERS)
        .expect(function (res) {
            return res;
        });
}

function getReports(testId, filter) {
    let url = `/v1/tests/${testId}/reports`;
    if (filter) {
        url += `?filter=${filter}`;
    }
    return request(testApp).get(url)
        .set(HEADERS)
        .expect(function (res) {
            return res;
        });
}

function getLastReports(limit, filter) {
    let url = `/v1/tests/last_reports?limit=${limit}`;
    if (filter) {
        url += `&filter=${filter}`;
    }
    return request(testApp).get(url)
        .set(HEADERS)
        .expect(function (res) {
            return res;
        });
}

async function subscribeRunnerToReport(testId, reportId, runnerId) {
    return request(testApp)
        .post(`/v1/tests/${testId}/reports/${reportId}/subscribe`)
        .set({ ...HEADERS, 'x-runner-id': runnerId })
        .send({})
        .end(function(res) {
            return res;
        });
}
