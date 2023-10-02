'use strict';

const should = require('should');
const sinon = require('sinon');
const rewire = require('rewire');
const logger = require('../../../../src/common/logger');
const aggregateReportGenerator = rewire('../../../../src/reports/models/aggregateReportGenerator');
const aggregateReportManager = rewire('../../../../src/reports/models/aggregateReportManager');
const chaosExperimentsManager = require('../../../../src/chaos-experiments/models/chaosExperimentsManager');
const databaseConnector = require('../../../../src/reports/models/databaseConnector');
const reportsManager = require('../../../../src/reports/models/reportsManager');

const REPORT = {
    test_id: 'test_id',
    report_id: 'report_id',
    status: 'initializing',
    phase: 0,
    test_name: 'some_test_name',
    webhooks: ['http://www.zooz.com'],
    arrival_rate: 100,
    job_id: 'job_id',
    duration: 10,
    environment: 'test'
};

describe('Artillery report generator test', () => {
    let sandbox,
        databaseConnectorGetStatsStub,
        getJobExperimentsByJobIdStub,
        getChaosExperimentsByIdsStub,
        loggerErrorStub,
        loggerWarnStub,
        reportsManagerGetReportStub;

    before(() => {
        sandbox = sinon.sandbox.create();
        databaseConnectorGetStatsStub = sandbox.stub(databaseConnector, 'getStats');
        reportsManagerGetReportStub = sandbox.stub(reportsManager, 'getReport');
        getJobExperimentsByJobIdStub = sandbox.stub(chaosExperimentsManager, 'getChaosJobExperimentsByJobId');
        getChaosExperimentsByIdsStub = sandbox.stub(chaosExperimentsManager, 'getChaosExperimentsByIds');
        loggerErrorStub = sandbox.stub(logger, 'error');
        loggerWarnStub = sandbox.stub(logger, 'warn');
    });

    beforeEach(() => {
        sandbox.resetHistory();
    });

    after(() => {
        sandbox.restore();
    });

    describe('Happy flows - Without parallelism', function () {
        before(function() {
            REPORT.parallelism = 1;
            reportsManagerGetReportStub.resolves(REPORT);
        });

        it('create aggregate report when there is only intermediate rows', async () => {
            databaseConnectorGetStatsStub.resolves(SINGLE_RUNNER_INTERMEDIATE_ROWS);
            getJobExperimentsByJobIdStub.resolves([]);

            const reportOutput = await aggregateReportGenerator.createAggregateReport(REPORT.test_id, REPORT.report_id);
            should(reportOutput.parallelism).eql(1);
        });

        it('create final report successfully with intermediate and some unknown stats phase', async function() {
            const statsWithUnknownData = JSON.parse(JSON.stringify(SINGLE_RUNNER_INTERMEDIATE_ROWS));
            statsWithUnknownData.push({ phase_status: 'some_unknown_phase', data: JSON.stringify({}) });
            databaseConnectorGetStatsStub.resolves(statsWithUnknownData);
            getJobExperimentsByJobIdStub.resolves([]);

            const reportOutput = await aggregateReportGenerator.createAggregateReport(REPORT.test_id, REPORT.report_id);
            should(reportOutput.parallelism).eql(1);
        });

        it('create final report successfully with intermediate and some unsupported stats data type', async function() {
            const statsWithUnknownData = JSON.parse(JSON.stringify(SINGLE_RUNNER_INTERMEDIATE_ROWS));
            statsWithUnknownData.push({ phase_status: 'intermediate', data: 'unsupported data type' });
            databaseConnectorGetStatsStub.resolves(statsWithUnknownData);

            const reportOutput = await aggregateReportGenerator.createAggregateReport(REPORT.test_id, REPORT.report_id);
            should(reportOutput.parallelism).eql(1);

            loggerWarnStub.callCount.should.eql(1);
        });

        it('create final report successfully with chaos experiments', async function() {
            const statsWithUnknownData = JSON.parse(JSON.stringify(SINGLE_RUNNER_INTERMEDIATE_ROWS));
            statsWithUnknownData.push({ phase_status: 'intermediate', data: 'unsupported data type' });
            databaseConnectorGetStatsStub.resolves(statsWithUnknownData);
            getJobExperimentsByJobIdStub.resolves(JOB_EXPERIMENTS_ROWS);
            getChaosExperimentsByIdsStub.resolves(CHAOS_EXPERIMENTS_ROWS);
            const reportOutput = await aggregateReportGenerator.createAggregateReport(REPORT.test_id, REPORT.report_id);
            should(reportOutput.experiments).deepEqual([
                {
                    kind: CHAOS_EXPERIMENTS_ROWS[0].kubeObject.kind,
                    name: CHAOS_EXPERIMENTS_ROWS[0].name,
                    id: JOB_EXPERIMENTS_ROWS[0].experiment_id,
                    start_time: JOB_EXPERIMENTS_ROWS[0].start_time,
                    end_time: JOB_EXPERIMENTS_ROWS[0].end_time
                },
                {
                    kind: CHAOS_EXPERIMENTS_ROWS[1].kubeObject.kind,
                    name: CHAOS_EXPERIMENTS_ROWS[1].name,
                    id: JOB_EXPERIMENTS_ROWS[1].experiment_id,
                    start_time: JOB_EXPERIMENTS_ROWS[1].start_time,
                    end_time: JOB_EXPERIMENTS_ROWS[1].end_time
                },
                {
                    kind: CHAOS_EXPERIMENTS_ROWS[2].kubeObject.kind,
                    name: CHAOS_EXPERIMENTS_ROWS[2].name,
                    id: JOB_EXPERIMENTS_ROWS[2].experiment_id,
                    start_time: JOB_EXPERIMENTS_ROWS[2].start_time,
                    end_time: JOB_EXPERIMENTS_ROWS[2].end_time
                }
            ]);
        });
    });

    describe('Happy flows - With parallelism', function () {
        before(function() {
            REPORT.parallelism = 3;
        });

        it('create aggregate report with intermediate rows - with stats interval 15 seconds', async () => {
            const STATS_INTERVAL = 15;
            aggregateReportManager.__set__('STATS_INTERVAL', STATS_INTERVAL);
            aggregateReportGenerator.__set__('aggregateReportManager', aggregateReportManager);
            const firstStatsTimestamp = JSON.parse(PARALLEL_INTERMEDIATE_ROWS[0].data).timestamp;

            reportsManagerGetReportStub.resolves(REPORT);
            getJobExperimentsByJobIdStub.resolves([]);
            REPORT.start_time = new Date(new Date(firstStatsTimestamp).getTime() - (STATS_INTERVAL * 1000));
            databaseConnectorGetStatsStub.resolves(PARALLEL_INTERMEDIATE_ROWS);
            const reportOutput = await aggregateReportGenerator.createAggregateReport(REPORT.test_id, REPORT.report_id);

            should(reportOutput.parallelism).eql(3);

            const bucket15 = reportOutput.intermediates[0];
            should(bucket15).containEql({
                bucket: 15,
                requestsCompleted: 894,
                scenariosCreated: 897,
                scenariosAvoided: 0,
                scenariosCompleted: 894,
                pendingRequests: 3,
                scenarioCounts: {
                    'Get response code 200': 897
                },
                errors: {},
                concurrency: 3,
                codes: {
                    200: 894
                },
                latency: {
                    median: 61.6,
                    max: 215.6,
                    min: 59.2,
                    p95: 75.83333333333333,
                    p99: 112.76666666666668
                },
                rps: {
                    mean: 60,
                    count: 897
                },
                scenarioDuration: {
                    median: 62.3,
                    max: 221.9,
                    min: 59.8,
                    p95: 76.7,
                    p99: 113.6
                }
            });
            const bucket30 = reportOutput.intermediates[1];
            should(bucket30).containEql({
                bucket: 30,
                requestsCompleted: 901,
                scenariosCreated: 903,
                scenariosAvoided: 0,
                scenariosCompleted: 901,
                pendingRequests: 5,
                scenarioCounts: {
                    'Get response code 200': 903
                },
                errors: {},
                concurrency: 5,
                codes: {
                    200: 901
                },
                latency: {
                    median: 61.9,
                    max: 361.1,
                    min: 59.4,
                    p95: 76.86570477247503,
                    p99: 86.93052164261931
                },
                rps: {
                    mean: 60,
                    count: 903
                },
                scenarioDuration: {
                    median: 62.5,
                    max: 361.7,
                    min: 59.9,
                    p95: 77.53240843507214,
                    p99: 87.59711431742508
                }
            });
            const bucket45 = reportOutput.intermediates[2];
            should(bucket45).containEql({
                bucket: 45,
                requestsCompleted: 900,
                scenariosCreated: 900,
                scenariosAvoided: 0,
                scenariosCompleted: 900,
                pendingRequests: 3,
                scenarioCounts: {
                    'Get response code 200': 900
                },
                errors: {},
                concurrency: 3,
                codes: {
                    200: 900
                },
                latency: {
                    median: 61.2,
                    max: 117.5,
                    min: 59.3,
                    p95: 72.9,
                    p99: 80.6
                },
                rps: {
                    mean: 60,
                    count: 900
                },
                scenarioDuration: {
                    median: 61.9,
                    max: 118,
                    min: 59.8,
                    p95: 73.5,
                    p99: 81.1
                }
            });
        });
    });

    describe('Bad flows - With parallelism', function () {
        it('create final report fails when sequelize returns error', async () => {
            databaseConnectorGetStatsStub.rejects(new Error('Database failure'));
            reportsManagerGetReportStub.resolves(REPORT);

            let testShouldFail = true;
            try {
                await aggregateReportGenerator.createAggregateReport('testId', 'reportId');
            } catch (error) {
                testShouldFail = false;
                error.message.should.eql('Database failure');
            }

            testShouldFail.should.eql(false, 'Test action was supposed to get exception');
        });

        it('create final report fails when no rows returned from sequelize ', async () => {
            databaseConnectorGetStatsStub.resolves([]);
            reportsManagerGetReportStub.resolves(REPORT);

            let testShouldFail = true;
            try {
                await aggregateReportGenerator.createAggregateReport(REPORT.test_id, REPORT.report_id);
            } catch (error) {
                testShouldFail = false;
                error.message.should.eql('Can not generate aggregate report as there are no statistics yet for testId: test_id and reportId: report_id');
                error.statusCode.should.eql(404);
                loggerErrorStub.callCount.should.eql(1);
                loggerErrorStub.args[0][0].should.deepEqual('Can not generate aggregate report as there are no statistics yet for testId: test_id and reportId: report_id');
            }

            testShouldFail.should.eql(false, 'Test action was supposed to get exception');
        });

        it('create final report fails when get experiments returns error on get job experiments', async () => {
            databaseConnectorGetStatsStub.resolves(SINGLE_RUNNER_INTERMEDIATE_ROWS);
            reportsManagerGetReportStub.rejects(new Error('Database failure'));

            let testShouldFail = true;
            try {
                await aggregateReportGenerator.createAggregateReport('testId', 'reportId');
            } catch (error) {
                testShouldFail = false;
                error.message.should.eql('Database failure');
            }

            testShouldFail.should.eql(false, 'Test action was supposed to get exception');
        });

        it('create final report fails when get experiments returns error on get chaos experiments', async () => {
            databaseConnectorGetStatsStub.resolves(SINGLE_RUNNER_INTERMEDIATE_ROWS);
            getJobExperimentsByJobIdStub.resolves(JOB_EXPERIMENTS_ROWS);
            getChaosExperimentsByIdsStub.rejects(new Error('Database failure'));

            let testShouldFail = true;
            try {
                await aggregateReportGenerator.createAggregateReport('testId', 'reportId');
            } catch (error) {
                testShouldFail = false;
                error.message.should.eql('Database failure');
            }

            testShouldFail.should.eql(false, 'Test action was supposed to get exception');
        });
    });
});

const timestamp = Date.now();

const SINGLE_RUNNER_INTERMEDIATE_ROWS = [{
    test_id: 'cb7d7862-55c2-4a9b-bcec-d41d54101836',
    report_id: 'b6489011-2073-4998-91cc-fd62f8b927f7',
    stats_time: '1526900730945',
    data: '{"timestamp":"2018-05-21T11:05:30.933Z","scenariosCreated":300,"scenariosCompleted":300,"requestsCompleted":600,"latency":{"min":160.6,"max":743.9,"median":191.5,"p95":264,"p99":611.8},"rps":{"count":600,"mean":40},"scenarioDuration":{"min":353,"max":1014.7,"median":384.8,"p95":629.4,"p99":930},"scenarioCounts":{"Scenario":300},"errors":{},"codes":{"201":600},"matches":0,"customStats":{},"concurrency":0,"pendingRequests":0}',
    phase_status: 'intermediate',
    state_id: 'c94cc1bd-31e8-403c-99cd-c75ce64605b5'
}];

const PARALLEL_INTERMEDIATE_ROWS = [
    {
        stats_id: '89435a1f-fb1b-4a83-a1a8-cb9367214a1b',
        test_id: '31017f1e-fd40-4489-a409-a62c67fc60ba',
        report_id: 'test',
        runner_id: '3f7b9e01-6160-4df6-9e8a-1d5f6a0ab837',
        stats_time: '2019-03-10T17:24:00.549Z',
        phase_status: 'intermediate',
        phase_index: '0',
        data: '{"timestamp":"2019-03-10T17:24:00.006Z","scenariosCreated":299,"scenariosCompleted":298,"requestsCompleted":298,"latency":{"min":59.2,"max":215.6,"median":61.5,"p95":76.9,"p99":125.4},"rps":{"count":299,"mean":20},"scenarioDuration":{"min":59.9,"max":221.9,"median":62.3,"p95":77.6,"p99":126.3},"scenarioCounts":{"Get response code 200":299},"errors":{},"codes":{"200":298},"matches":0,"customStats":{},"counters":{},"concurrency":1,"pendingRequests":1,"scenariosAvoided":0}'
    },
    {
        stats_id: '27981b3d-c3b4-44b6-9821-f1111a29c952',
        test_id: '31017f1e-fd40-4489-a409-a62c67fc60ba',
        report_id: 'test',
        runner_id: 'c92c7c98-3be1-4392-bc4e-378732119bbe',
        stats_time: '2019-03-10T17:24:00.676Z',
        phase_status: 'intermediate',
        phase_index: '0',
        data: '{"timestamp":"2019-03-10T17:24:00.672Z","scenariosCreated":299,"scenariosCompleted":298,"requestsCompleted":298,"latency":{"min":59.2,"max":133.5,"median":61.6,"p95":76.1,"p99":107.4},"rps":{"count":299,"mean":20},"scenarioDuration":{"min":59.8,"max":139.5,"median":62.4,"p95":76.9,"p99":108.2},"scenarioCounts":{"Get response code 200":299},"errors":{},"codes":{"200":298},"matches":0,"customStats":{},"counters":{},"concurrency":1,"pendingRequests":1,"scenariosAvoided":0}'
    },
    {
        stats_id: '62fe8964-3cc6-43a3-adcd-67a17aa9fe39',
        test_id: '31017f1e-fd40-4489-a409-a62c67fc60ba',
        report_id: 'test',
        runner_id: 'afd625eb-f701-4721-be83-aa85100d69cd',
        stats_time: '2019-03-10T17:24:01.018Z',
        phase_status: 'intermediate',
        phase_index: '0',
        data: '{"timestamp":"2019-03-10T17:24:01.015Z","scenariosCreated":299,"scenariosCompleted":298,"requestsCompleted":298,"latency":{"min":59.7,"max":141.7,"median":61.6,"p95":74.5,"p99":105.5},"rps":{"count":299,"mean":20},"scenarioDuration":{"min":60.3,"max":146.4,"median":62.3,"p95":75.6,"p99":106.3},"scenarioCounts":{"Get response code 200":299},"errors":{},"codes":{"200":298},"matches":0,"customStats":{},"counters":{},"concurrency":1,"pendingRequests":1,"scenariosAvoided":0}'
    },
    {
        stats_id: 'e93fec46-4f68-45ae-8ef6-c644fda3fcbf',
        test_id: '31017f1e-fd40-4489-a409-a62c67fc60ba',
        report_id: 'test',
        runner_id: '3f7b9e01-6160-4df6-9e8a-1d5f6a0ab837',
        stats_time: '2019-03-10T17:24:15.560Z',
        phase_status: 'intermediate',
        phase_index: '0',
        data: '{"timestamp":"2019-03-10T17:24:15.558Z","scenariosCreated":301,"scenariosCompleted":301,"requestsCompleted":301,"latency":{"min":59.4,"max":355.2,"median":62,"p95":76,"p99":84.4},"rps":{"count":301,"mean":20},"scenarioDuration":{"min":60,"max":355.8,"median":62.7,"p95":76.7,"p99":85},"scenarioCounts":{"Get response code 200":301},"errors":{},"codes":{"200":301},"matches":0,"customStats":{},"counters":{},"concurrency":1,"pendingRequests":1,"scenariosAvoided":0}'
    },
    {
        stats_id: '7fe20a63-9b50-4504-9758-dda6e777f4de',
        test_id: '31017f1e-fd40-4489-a409-a62c67fc60ba',
        report_id: 'test',
        runner_id: 'c92c7c98-3be1-4392-bc4e-378732119bbe',
        stats_time: '2019-03-10T17:24:15.686Z',
        phase_status: 'intermediate',
        phase_index: '0',
        data: '{"timestamp":"2019-03-10T17:24:15.684Z","scenariosCreated":301,"scenariosCompleted":300,"requestsCompleted":300,"latency":{"min":59.4,"max":361.1,"median":61.9,"p95":77.2,"p99":86.3},"rps":{"count":301,"mean":20},"scenarioDuration":{"min":59.9,"max":361.7,"median":62.5,"p95":77.8,"p99":87},"scenarioCounts":{"Get response code 200":301},"errors":{},"codes":{"200":300},"matches":0,"customStats":{},"counters":{},"concurrency":2,"pendingRequests":2,"scenariosAvoided":0}'
    },
    {
        stats_id: '289c183f-6477-44e2-be38-c51c963797ee',
        test_id: '31017f1e-fd40-4489-a409-a62c67fc60ba',
        report_id: 'test',
        runner_id: 'afd625eb-f701-4721-be83-aa85100d69cd',
        stats_time: '2019-03-10T17:24:16.031Z',
        phase_status: 'intermediate',
        phase_index: '0',
        data: '{"timestamp":"2019-03-10T17:24:16.029Z","scenariosCreated":301,"scenariosCompleted":300,"requestsCompleted":300,"latency":{"min":59.5,"max":347.1,"median":61.7,"p95":77.4,"p99":90.1},"rps":{"count":301,"mean":20},"scenarioDuration":{"min":60.2,"max":347.8,"median":62.4,"p95":78.1,"p99":90.8},"scenarioCounts":{"Get response code 200":301},"errors":{},"codes":{"200":300},"matches":0,"customStats":{},"counters":{},"concurrency":2,"pendingRequests":2,"scenariosAvoided":0}'
    },
    {
        stats_id: '82eab6f5-c0e0-4d82-a246-049817ec2476',
        test_id: '31017f1e-fd40-4489-a409-a62c67fc60ba',
        report_id: 'test',
        runner_id: '3f7b9e01-6160-4df6-9e8a-1d5f6a0ab837',
        stats_time: '2019-03-10T17:24:45.577Z',
        phase_status: 'intermediate',
        phase_index: '0',
        data: '{"timestamp":"2019-03-10T17:24:31.575Z","scenariosCreated":300,"scenariosCompleted":300,"requestsCompleted":300,"latency":{"min":59.5,"max":117.5,"median":61.2,"p95":72.5,"p99":78.1},"rps":{"count":300,"mean":20},"scenarioDuration":{"min":60,"max":118,"median":61.8,"p95":73.1,"p99":78.6},"scenarioCounts":{"Get response code 200":300},"errors":{},"codes":{"200":300},"matches":0,"customStats":{},"counters":{},"concurrency":1,"pendingRequests":1,"scenariosAvoided":0}'
    },
    {
        stats_id: '93737e55-cebf-44c0-92bb-5cdd6e64635f',
        test_id: '31017f1e-fd40-4489-a409-a62c67fc60ba',
        report_id: 'test',
        runner_id: 'c92c7c98-3be1-4392-bc4e-378732119bbe',
        stats_time: '2019-03-10T17:24:45.700Z',
        phase_status: 'intermediate',
        phase_index: '0',
        data: '{"timestamp":"2019-03-10T17:24:32.698Z","scenariosCreated":300,"scenariosCompleted":300,"requestsCompleted":300,"latency":{"min":59.3,"max":86.9,"median":61.2,"p95":73.3,"p99":79.7},"rps":{"count":300,"mean":20},"scenarioDuration":{"min":59.8,"max":87.4,"median":61.9,"p95":73.9,"p99":80.2},"scenarioCounts":{"Get response code 200":300},"errors":{},"codes":{"200":300},"matches":0,"customStats":{},"counters":{},"concurrency":1,"pendingRequests":1,"scenariosAvoided":0}'
    },
    {
        stats_id: '875f3e89-593b-4fbf-9228-957ce5c691ff',
        test_id: '31017f1e-fd40-4489-a409-a62c67fc60ba',
        report_id: 'test',
        runner_id: 'afd625eb-f701-4721-be83-aa85100d69cd',
        stats_time: '2019-03-10T17:24:46.046Z',
        phase_status: 'intermediate',
        phase_index: '0',
        data: '{"timestamp":"2019-03-10T17:24:33.043Z","scenariosCreated":300,"scenariosCompleted":300,"requestsCompleted":300,"latency":{"min":59.5,"max":98.3,"median":61.3,"p95":72.9,"p99":84},"rps":{"count":300,"mean":20},"scenarioDuration":{"min":60,"max":98.9,"median":61.9,"p95":73.5,"p99":84.5},"scenarioCounts":{"Get response code 200":300},"errors":{},"codes":{"200":300},"matches":0,"customStats":{},"counters":{},"concurrency":1,"pendingRequests":1,"scenariosAvoided":0}'
    }
];

const JOB_EXPERIMENTS_ROWS = [{
    job_id: REPORT.job_id,
    experiment_id: '1234-abc-5678',
    start_time: timestamp,
    end_time: timestamp + 100
},
{
    job_id: REPORT.job_id,
    experiment_id: 'abcd-1234-efgh',
    start_time: timestamp,
    end_time: timestamp + 200
},
{
    job_id: REPORT.job_id,
    experiment_id: '4321-abc-5678',
    start_time: timestamp,
    end_time: timestamp + 300
}];

const CHAOS_EXPERIMENTS_ROWS = [{
    id: '1234-abc-5678',
    name: 'first-experiment',
    kubeObject: { kind: 'PodChaos' }
},
{
    id: 'abcd-1234-efgh',
    name: 'second-experiment',
    kubeObject: { kind: 'DNSChaos' }
},
{
    id: '4321-abc-5678',
    name: 'third-experiment',
    kubeObject: { kind: 'IOChaos' }
}];
