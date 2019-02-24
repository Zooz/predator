'use strict';

let sinon = require('sinon');
let should = require('should');
let fs = require('fs');
let path = require('path');
let logger = require('../../../../src/common/logger');
let artilleryReportGenerator = require('../../../../src/reports/models/artilleryReportGenerator');
let databaseConnector = require('../../../../src/reports/models/databaseConnector');
let HtmlDiffer = require('html-differ').HtmlDiffer;
let htmlDiffer = new HtmlDiffer('bem');
let htmlDiffLogger = require('html-differ/lib/logger');

const INTERMEDIATE_AND_SUMMARY_ROWS = [{
    'test_id': 'cb7d7862-55c2-4a9b-bcec-d41d54101836',
    'report_id': 'b6489011-2073-4998-91cc-fd62f8b927f7',
    'stats_time': '1526900730945',
    'data': '{"timestamp":"2018-05-21T11:05:30.933Z","scenariosCreated":300,"scenariosCompleted":300,"requestsCompleted":600,"latency":{"min":160.6,"max":743.9,"median":191.5,"p95":264,"p99":611.8},"rps":{"count":600,"mean":39.19},"scenarioDuration":{"min":353,"max":1014.7,"median":384.8,"p95":629.4,"p99":930},"scenarioCounts":{"Scenario":300},"errors":{},"codes":{"201":600},"matches":0,"customStats":{},"concurrency":0,"pendingRequests":0}',
    'phase_status': 'intermediate',
    'state_id': 'c94cc1bd-31e8-403c-99cd-c75ce64605b5'
}, {
    'test_id': 'cb7d7862-55c2-4a9b-bcec-d41d54101836',
    'report_id': 'b6489011-2073-4998-91cc-fd62f8b927f7',
    'stats_time': '1526900732453',
    'data': '{"timestamp":"2018-05-21T11:05:30.947Z","scenariosCreated":300,"scenariosCompleted":300,"requestsCompleted":600,"latency":{"min":160.6,"max":743.9,"median":191.5,"p95":264,"p99":611.8},"rps":{"count":600,"mean":39.16},"scenarioDuration":{"min":353,"max":1014.7,"median":384.8,"p95":629.4,"p99":930},"scenarioCounts":{"Scenario":300},"errors":{},"codes":{"201":600},"matches":0,"customStats":{},"concurrency":0,"pendingRequests":0}',
    'phase_status': 'aggregate',
    'state_id': '949f1448-3b22-47ab-aef8-387c74f5ceac'
}];

const ONLY_INTERMEDIATE_ROWS = [{
    'test_id': 'cb7d7862-55c2-4a9b-bcec-d41d54101836',
    'report_id': 'b6489011-2073-4998-91cc-fd62f8b927f7',
    'stats_time': '1526900730945',
    'data': '{"timestamp":"2018-05-21T11:05:30.933Z","scenariosCreated":300,"scenariosCompleted":300,"requestsCompleted":600,"latency":{"min":160.6,"max":743.9,"median":191.5,"p95":264,"p99":611.8},"rps":{"count":600,"mean":39.19},"scenarioDuration":{"min":353,"max":1014.7,"median":384.8,"p95":629.4,"p99":930},"scenarioCounts":{"Scenario":300},"errors":{},"codes":{"201":600},"matches":0,"customStats":{},"concurrency":0,"pendingRequests":0}',
    'phase_status': 'intermediate',
    'state_id': 'c94cc1bd-31e8-403c-99cd-c75ce64605b5'
}];

describe('Artillery report generator test', () => {
    let sandbox, databaseConnectorGetStatsStub, loggerErrorStub, loggerWarnStub;

    before(() => {
        sandbox = sinon.sandbox.create();
        databaseConnectorGetStatsStub = sandbox.stub(databaseConnector, 'getStats');
        loggerErrorStub = sandbox.stub(logger, 'error');
        loggerWarnStub = sandbox.stub(logger, 'warn');
    });

    beforeEach(() => {
        sandbox.resetHistory();
    });

    after(() => {
        sandbox.restore();
    });

    it('create artillery report successfully with summary and intermediate data ', async () => {
        databaseConnectorGetStatsStub.resolves(INTERMEDIATE_AND_SUMMARY_ROWS);
        let reportOutput = await artilleryReportGenerator.createArtilleryReport('testId', 'reportId');
        let expectedResultFilePath = path.join(
            path.dirname(__filename),
            '../expectedOutputs/expectedArtilleryReport.html');

        let expectedHtmlReport = fs.readFileSync(expectedResultFilePath, 'utf-8');
        try {
            htmlDiffer.isEqual(expectedHtmlReport, reportOutput).should.be.true();
        } catch (error) {
            let diff = htmlDiffer.diffHtml(expectedHtmlReport, reportOutput);
            htmlDiffLogger.logDiffText(diff);
            throw error;
        }
    });

    it('create artillery report successfully with summary, intermediate and some unknown stats ', async () => {
        let statsWithUnknownData = JSON.parse(JSON.stringify(INTERMEDIATE_AND_SUMMARY_ROWS));

        statsWithUnknownData.push({'phase_status': 'some_unknown_phase'});

        databaseConnectorGetStatsStub.resolves(statsWithUnknownData);
        let reportOutput = await artilleryReportGenerator.createArtilleryReport('testId', 'reportId');

        let expectedResultFilePath = path.join(
            path.dirname(__filename),
            '../expectedOutputs/expectedArtilleryReport.html');

        let expectedHtmlReport = fs.readFileSync(expectedResultFilePath, 'utf-8');

        try {
            htmlDiffer.isEqual(expectedHtmlReport, reportOutput).should.be.true();
        } catch (error) {
            let diff = htmlDiffer.diffHtml(expectedHtmlReport, reportOutput);
            htmlDiffLogger.logDiffText(diff, {charsAroundDiff: 40});
            throw error;
        }

        loggerWarnStub.callCount.should.eql(1);
    });

    it('create artillery fails when can not get stats from cassandra', async () => {
        databaseConnectorGetStatsStub.rejects(new Error('Database failure'));

        let testShouldFail = true;
        try {
            await artilleryReportGenerator.createArtilleryReport('testId', 'reportId');
        } catch (error) {
            testShouldFail = false;
            error.message.should.eql('Database failure');
            loggerErrorStub.callCount.should.eql(1);
            let expectedError = new Error('Database failure');
            expectedError.statusCode = 500;
            loggerErrorStub.args[0][0].should.deepEqual(expectedError);
            loggerErrorStub.args[0][1].should.deepEqual('Failed to get stats from database');
        }

        testShouldFail.should.eql(false, 'Test action was supposed to get exception');
    });

    it('create artillery success when there is only intermediate rows', async () => {
        databaseConnectorGetStatsStub.resolves(ONLY_INTERMEDIATE_ROWS);

        let reportOutput = await artilleryReportGenerator.createArtilleryReport('testId', 'reportId');

        let expectedResultFilePath = path.join(
            path.dirname(__filename),
            '../expectedOutputs/expectedArtilleryReportNoAggregate.html');

        let expectedHtmlReport = fs.readFileSync(expectedResultFilePath, 'utf-8');

        try {
            htmlDiffer.isEqual(expectedHtmlReport, reportOutput).should.be.true();
        } catch (error) {
            let diff = htmlDiffer.diffHtml(expectedHtmlReport, reportOutput);
            htmlDiffLogger.logDiffText(diff, {charsAroundDiff: 40});
            throw error;
        }
    });

    it('create artillery fails no rows returned from cassandra ', async () => {
        databaseConnectorGetStatsStub.resolves([]);

        let testShouldFail = true;
        try {
            await artilleryReportGenerator.createArtilleryReport('testId', 'reportId');
        } catch (error) {
            testShouldFail = false;
            error.message.should.eql('Can not generate artillery report as testId: testId and reportId: reportId is not found');
            error.statusCode.should.eql(404);
            loggerErrorStub.callCount.should.eql(1);
            loggerErrorStub.args[0][0].should.deepEqual('Can not generate artillery report as testId: testId and reportId: reportId is not found');
        }

        testShouldFail.should.eql(false, 'Test action was supposed to get exception');
    });
});