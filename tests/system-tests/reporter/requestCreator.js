'use strict';

const request = require('supertest');

const URL = process.env.URL || 'http://localhost:8080';
const HEADERS = {'Content-Type': 'application/json'};

module.exports = {
    createReport,
    postStats,
    getReport,
    getReports,
    getLastReports,
    getHTMLReport
};

function createReport(testId, body) {
    return request(URL).post(`/v1/tests/${testId}/reports`)
        .send(body)
        .set(HEADERS)
        .expect(function(res){
            return res;
        });
}

function postStats(testId, reportId, body) {
    return request(URL).post(`/v1/tests/${testId}/reports/${reportId}/stats`)
        .send(body)
        .set(HEADERS)
        .expect(function(res){
            return res;
        });
}

function getReport(testId, reportId) {
    return request(URL).get(`/v1/tests/${testId}/reports/${reportId}`)
        .set(HEADERS)
        .expect(function(res){
            return res;
        });
}

function getReports(testId) {
    return request(URL).get(`/v1/tests/${testId}/reports`)
        .set(HEADERS)
        .expect(function(res){
            return res;
        });
}

function getLastReports(limit) {
    return request(URL).get(`/v1/tests/last_reports?limit=${limit}`)
        .set(HEADERS)
        .expect(function(res){
            return res;
        });
}

function getHTMLReport(testId, reportId) {
    return request(URL).get(`/v1/tests/${testId}/reports/${reportId}/html`)
        .set(HEADERS)
        .expect(function(res){
            return res;
        });
}