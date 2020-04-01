'use strict';

const request = require('supertest');

const app = require('../../../../src/app');

let testApp;
const HEADERS = { 'Content-Type': 'application/json' };

module.exports = {
    init,
    createReport,
    postStats,
    getReport,
    getReports,
    editReport,
    getLastReports
};

async function init() {
    testApp = await app();
}

function createReport(testId, body) {
    return request(testApp).post(`/v1/tests/${testId}/reports`)
        .send(body)
        .set(HEADERS)
        .expect(function(res){
            return res;
        });
}

function postStats(testId, reportId, body) {
    return request(testApp).post(`/v1/tests/${testId}/reports/${reportId}/stats`)
        .send(body)
        .set(HEADERS)
        .expect(function(res){
            return res;
        });
}
function editReport(testId, reportId, body) {
    return request(testApp).put(`/v1/tests/${testId}/reports/${reportId}`)
        .send(body)
        .set(HEADERS)
        .expect(function(res){
            return res;
        });
}

function getReport(testId, reportId) {
    return request(testApp).get(`/v1/tests/${testId}/reports/${reportId}`)
        .set(HEADERS)
        .expect(function(res){
            return res;
        });
}

function getReports(testId) {
    return request(testApp).get(`/v1/tests/${testId}/reports`)
        .set(HEADERS)
        .expect(function(res){
            return res;
        });
}

function getLastReports(limit) {
    return request(testApp).get(`/v1/tests/last_reports?limit=${limit}`)
        .set(HEADERS)
        .expect(function(res){
            return res;
        });
}
