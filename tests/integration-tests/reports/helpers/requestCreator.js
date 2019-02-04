'use strict';

const request = require('supertest');
const uuid = require('uuid');

const app = require('../../../../src/app');
const jobRequestCreator = require('../../jobs/helpers/requestCreator');

let testApp;
const HEADERS = { 'Content-Type': 'application/json' };

module.exports = {
    init,
    createJob,
    createReport,
    postStats,
    getReport,
    getReports,
    getLastReports,
    getHTMLReport
};

async function init() {
    testApp = await app();
}

function createJob(emails, webhooks) {
    let jobOptions = {
        test_id: uuid(),
        arrival_rate: 10,
        duration: 10,
        environment: 'test',
        cron_expression: '0 0 1 * *'
    };

    if (emails) {
        jobOptions.emails = emails;
    }

    if (webhooks) {
        jobOptions.webhooks = webhooks;
    }

    return jobRequestCreator.createJob(jobOptions, HEADERS);
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

function getHTMLReport(testId, reportId) {
    return request(testApp).get(`/v1/tests/${testId}/reports/${reportId}/html`)
        .set(HEADERS)
        .expect(function(res){
            return res;
        });
}