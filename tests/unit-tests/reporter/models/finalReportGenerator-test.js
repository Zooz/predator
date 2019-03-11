'use strict';

const should = require('should');
const sinon = require('sinon');
const rewire = require('rewire');
const logger = require('../../../../src/common/logger');
const finalReportGenerator = rewire('../../../../src/reports/models/finalReportGenerator');
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
    duration: 10,
    environment: 'test'
};

describe('Artillery report generator test', () => {
    let sandbox, databaseConnectorGetStatsStub, loggerErrorStub, loggerWarnStub, reportsManagerGetReportStub;

    before(() => {
        sandbox = sinon.sandbox.create();
        databaseConnectorGetStatsStub = sandbox.stub(databaseConnector, 'getStats');
        reportsManagerGetReportStub = sandbox.stub(reportsManager, 'getReport');
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
        });

        it('create aggregate report when there is only intermediate rows', async () => {
            databaseConnectorGetStatsStub.resolves(ONLY_INTERMEDIATE_ROWS);
            reportsManagerGetReportStub.resolves(REPORT);

            let reportOutput = await finalReportGenerator.createFinalReport('testId', 'reportId');
            should(reportOutput.parallelism).eql(1);
        });

        it('create aggregate report successfully with summary and intermediate data', async function() {
            databaseConnectorGetStatsStub.resolves(INTERMEDIATE_AND_SUMMARY_ROWS);
            reportsManagerGetReportStub.resolves(REPORT);
            let reportOutput = await finalReportGenerator.createFinalReport('testId', 'reportId');
            console.log(reportOutput);
        });

        it('create final report successfully with summary, intermediate and some unknown stats phase', async function() {
            let statsWithUnknownData = JSON.parse(JSON.stringify(INTERMEDIATE_AND_SUMMARY_ROWS));
            statsWithUnknownData.push({ 'phase_status': 'some_unknown_phase', 'data': JSON.stringify({}) });
            databaseConnectorGetStatsStub.resolves(statsWithUnknownData);
            reportsManagerGetReportStub.resolves(REPORT);

            let reportOutput = await finalReportGenerator.createFinalReport('testId', 'reportId');
            should(reportOutput.parallelism).eql(1);

            loggerWarnStub.callCount.should.eql(1);
        });

        it('create final report successfully with summary, intermediate and some unsupported stats data type', async function() {
            let statsWithUnknownData = JSON.parse(JSON.stringify(INTERMEDIATE_AND_SUMMARY_ROWS));
            statsWithUnknownData.push({ 'phase_status': 'intermediate', 'data': 'unsupported data type' });
            databaseConnectorGetStatsStub.resolves(statsWithUnknownData);
            reportsManagerGetReportStub.resolves(REPORT);

            let reportOutput = await finalReportGenerator.createFinalReport('testId', 'reportId');
            should(reportOutput.parallelism).eql(1);

            loggerWarnStub.callCount.should.eql(1);
        });
    });

    describe('Happy flows - With parallelism', function () {
        before(function() {
            REPORT.parallelism = 3;
        });

        it('create aggregate report when there is only intermediate rows - with stats interval 15 seconds', async () => {
            const STATS_INTERVAL = 15;
            finalReportGenerator.__set__('STATS_INTERVAL', STATS_INTERVAL);
            const firstStatsTimestamp = JSON.parse(PARALLEL_INTERMEDIATE_ROWS[0].data).timestamp;

            REPORT.start_time = new Date(new Date(firstStatsTimestamp).getTime() - (STATS_INTERVAL * 1000));
            databaseConnectorGetStatsStub.resolves(PARALLEL_INTERMEDIATE_ROWS);
            reportsManagerGetReportStub.resolves(REPORT);
            const reportOutput = await finalReportGenerator.createFinalReport('testId', 'reportId');

            should(reportOutput.parallelism).eql(3);

            const bucket15 = reportOutput.intermediate[0];
            should(bucket15).containEql({
                'bucket': 15,
                'requestsCompleted': 894,
                'scenariosCreated': 897,
                'scenariosAvoided': 0,
                'scenariosCompleted': 894,
                'pendingRequests': 3,
                'scenarioCounts': {
                    'Get response code 200': 897
                },
                'errors': {},
                'concurrency': 3,
                'codes': {
                    '200': 894
                },
                'latency': {
                    'median': 61.6,
                    'max': 215.6,
                    'min': 59.2,
                    'p95': 75.83333333333333,
                    'p99': 112.76666666666668
                },
                'rps': {
                    'mean': 59.8,
                    'count': 897
                },
                'scenarioDuration': {
                    'p95': 76.7,
                    'p99': 113.6
                }
            });
            const bucket30 = reportOutput.intermediate[1];
            should(bucket30).containEql({
                'bucket': 30,
                'requestsCompleted': 901,
                'scenariosCreated': 903,
                'scenariosAvoided': 0,
                'scenariosCompleted': 901,
                'pendingRequests': 5,
                'scenarioCounts': {
                    'Get response code 200': 903
                },
                'errors': {},
                'concurrency': 5,
                'codes': {
                    '200': 901
                },
                'latency': {
                    'median': 61.9,
                    'max': 361.1,
                    'min': 59.4,
                    'p95': 76.86570477247503,
                    'p99': 86.93052164261931
                },
                'rps': {
                    'mean': 60.2,
                    'count': 903
                },
                'scenarioDuration': {
                    'p95': 77.53240843507214,
                    'p99': 87.59711431742508
                }
            });
            const bucket45 = reportOutput.intermediate[2];
            should(bucket45).containEql({
                'bucket': 45,
                'requestsCompleted': 900,
                'scenariosCreated': 900,
                'scenariosAvoided': 0,
                'scenariosCompleted': 900,
                'pendingRequests': 3,
                'scenarioCounts': {
                    'Get response code 200': 900
                },
                'errors': {},
                'concurrency': 3,
                'codes': {
                    '200': 900
                },
                'latency': {
                    'median': 61.2,
                    'max': 117.5,
                    'min': 59.3,
                    'p95': 72.9,
                    'p99': 80.6
                },
                'rps': {
                    'mean': 60,
                    'count': 900
                },
                'scenarioDuration': {
                    'p95': 73.5,
                    'p99': 81.1
                }
            });

            should(reportOutput.final_report.length).eql(0);

        });

        it('create final report successfully with summary and intermediate data - stats interval 30 seconds', async function() {
            const STATS_INTERVAL = 30;
            finalReportGenerator.__set__('STATS_INTERVAL', STATS_INTERVAL);
            const firstStatsTimestamp = JSON.parse(PARALLEL_INTERMEDIATE_AND_SUMMARY_ROWS[0].data).timestamp;

            REPORT.start_time = new Date(new Date(firstStatsTimestamp).getTime() - (STATS_INTERVAL * 1000));
            databaseConnectorGetStatsStub.resolves(PARALLEL_INTERMEDIATE_AND_SUMMARY_ROWS);
            reportsManagerGetReportStub.resolves(REPORT);
            const reportOutput = await finalReportGenerator.createFinalReport('testId', 'reportId');

            should(reportOutput.parallelism).eql(3);

            should(reportOutput.intermediate.length).eql(3);
            const bucket30 = reportOutput.intermediate[0];
            should(bucket30).containEql({
                'bucket': 30,
                'requestsCompleted': 1794,
                'scenariosCreated': 1797,
                'scenariosAvoided': 0,
                'scenariosCompleted': 1794,
                'pendingRequests': 3,
                'scenarioCounts': {
                    'Get response code 200': 1797
                },
                'errors': {},
                'concurrency': 3,
                'codes': {
                    '200': 1794
                },
                'latency': {
                    'median': 60.9,
                    'max': 373.3,
                    'min': 58.9,
                    'p95': 76.43333333333334,
                    'p99': 95.6
                },
                'rps': {
                    'mean': 59.9,
                    'count': 1797
                },
                'scenarioDuration': {
                    'p95': 77.03333333333333,
                    'p99': 96.23333333333333
                }
            });
            const bucket60 = reportOutput.intermediate[1];
            should(bucket60).containEql({
                'bucket': 60,
                'requestsCompleted': 1803,
                'scenariosCreated': 1803,
                'scenariosAvoided': 0,
                'scenariosCompleted': 1803,
                'pendingRequests': 3,
                'scenarioCounts': {
                    'Get response code 200': 1803
                },
                'errors': {},
                'concurrency': 3,
                'codes': {
                    '200': 1803
                },
                'latency': {
                    'median': 60.9,
                    'max': 356.4,
                    'min': 59,
                    'p95': 76.36666666666667,
                    'p99': 93.16666666666667
                },
                'rps': {
                    'mean': 60.1,
                    'count': 1803
                },
                'scenarioDuration': {
                    'p95': 77,
                    'p99': 93.73333333333333
                }
            });
            const bucket90 = reportOutput.intermediate[2];
            should(bucket90).containEql({
                'bucket': 90,
                'requestsCompleted': 1800,
                'scenariosCreated': 1800,
                'scenariosAvoided': 0,
                'scenariosCompleted': 1800,
                'pendingRequests': 3,
                'scenarioCounts': {
                    'Get response code 200': 1800
                },
                'errors': {},
                'concurrency': 3,
                'codes': {
                    '200': 1800
                },
                'latency': {
                    'median': 60.8,
                    'max': 374,
                    'min': 59,
                    'p95': 69.8,
                    'p99': 91.06666666666666
                },
                'rps': {
                    'mean': 60,
                    'count': 1800
                },
                'scenarioDuration': {
                    'p95': 70.3,
                    'p99': 91.56666666666666
                }
            });
            should(reportOutput.final_report.length).eql(3);
            should(reportOutput.aggregate).containEql({
                'bucket': 90,
                'requestsCompleted': 6000,
                'scenariosCreated': 6000,
                'scenariosAvoided': 0,
                'scenariosCompleted': 6000,
                'pendingRequests': 9,
                'scenarioCounts': {
                    'Get response code 200': 6000
                },
                'errors': {},
                'concurrency': 9,
                'codes': {
                    '200': 6000
                },
                'latency': {
                    'median': 60.8,
                    'max': 374,
                    'min': 58.9,
                    'p95': 75.03333333333333,
                    'p99': 90.43333333333334
                },
                'rps': {
                    'mean': 200,
                    'count': 6000
                },
                'scenarioDuration': {
                    'p95': 75.63333333333334,
                    'p99': 90.93333333333334
                }
            });
        });
    });

    describe('Bad flows - With parallelism', function () {
        it('create final report fails when cassandra returns error', async () => {
            databaseConnectorGetStatsStub.rejects(new Error('Database failure'));
            reportsManagerGetReportStub.resolves(REPORT);

            let testShouldFail = true;
            try {
                await finalReportGenerator.createFinalReport('testId', 'reportId');
            } catch (error) {
                testShouldFail = false;
                error.message.should.eql('Database failure');
            }

            testShouldFail.should.eql(false, 'Test action was supposed to get exception');
        });

        it('create final report fails when no rows returned from cassandra ', async () => {
            databaseConnectorGetStatsStub.resolves([]);
            reportsManagerGetReportStub.resolves(REPORT);

            let testShouldFail = true;
            try {
                await finalReportGenerator.createFinalReport('testId', 'reportId');
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
});

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
    'phase_status': 'final_report',
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

const PARALLEL_INTERMEDIATE_ROWS = [
    {
        'stats_id': '89435a1f-fb1b-4a83-a1a8-cb9367214a1b',
        'test_id': '31017f1e-fd40-4489-a409-a62c67fc60ba',
        'report_id': 'test',
        'runner_id': '3f7b9e01-6160-4df6-9e8a-1d5f6a0ab837',
        'stats_time': '2019-03-10T17:24:00.549Z',
        'phase_status': 'intermediate',
        'phase_index': '0',
        'data': '{"timestamp":"2019-03-10T17:24:00.006Z","scenariosCreated":299,"scenariosCompleted":298,"requestsCompleted":298,"latency":{"min":59.2,"max":215.6,"median":61.5,"p95":76.9,"p99":125.4},"rps":{"count":299,"mean":20},"scenarioDuration":{"min":59.9,"max":221.9,"median":62.3,"p95":77.6,"p99":126.3},"scenarioCounts":{"Get response code 200":299},"errors":{},"codes":{"200":298},"matches":0,"customStats":{},"counters":{},"concurrency":1,"pendingRequests":1,"scenariosAvoided":0}'
    },
    {
        'stats_id': '27981b3d-c3b4-44b6-9821-f1111a29c952',
        'test_id': '31017f1e-fd40-4489-a409-a62c67fc60ba',
        'report_id': 'test',
        'runner_id': 'c92c7c98-3be1-4392-bc4e-378732119bbe',
        'stats_time': '2019-03-10T17:24:00.676Z',
        'phase_status': 'intermediate',
        'phase_index': '0',
        'data': '{"timestamp":"2019-03-10T17:24:00.672Z","scenariosCreated":299,"scenariosCompleted":298,"requestsCompleted":298,"latency":{"min":59.2,"max":133.5,"median":61.6,"p95":76.1,"p99":107.4},"rps":{"count":299,"mean":20.01},"scenarioDuration":{"min":59.8,"max":139.5,"median":62.4,"p95":76.9,"p99":108.2},"scenarioCounts":{"Get response code 200":299},"errors":{},"codes":{"200":298},"matches":0,"customStats":{},"counters":{},"concurrency":1,"pendingRequests":1,"scenariosAvoided":0}'
    },
    {
        'stats_id': '62fe8964-3cc6-43a3-adcd-67a17aa9fe39',
        'test_id': '31017f1e-fd40-4489-a409-a62c67fc60ba',
        'report_id': 'test',
        'runner_id': 'afd625eb-f701-4721-be83-aa85100d69cd',
        'stats_time': '2019-03-10T17:24:01.018Z',
        'phase_status': 'intermediate',
        'phase_index': '0',
        'data': '{"timestamp":"2019-03-10T17:24:01.015Z","scenariosCreated":299,"scenariosCompleted":298,"requestsCompleted":298,"latency":{"min":59.7,"max":141.7,"median":61.6,"p95":74.5,"p99":105.5},"rps":{"count":299,"mean":20},"scenarioDuration":{"min":60.3,"max":146.4,"median":62.3,"p95":75.6,"p99":106.3},"scenarioCounts":{"Get response code 200":299},"errors":{},"codes":{"200":298},"matches":0,"customStats":{},"counters":{},"concurrency":1,"pendingRequests":1,"scenariosAvoided":0}'
    },
    {
        'stats_id': 'e93fec46-4f68-45ae-8ef6-c644fda3fcbf',
        'test_id': '31017f1e-fd40-4489-a409-a62c67fc60ba',
        'report_id': 'test',
        'runner_id': '3f7b9e01-6160-4df6-9e8a-1d5f6a0ab837',
        'stats_time': '2019-03-10T17:24:15.560Z',
        'phase_status': 'intermediate',
        'phase_index': '0',
        'data': '{"timestamp":"2019-03-10T17:24:15.558Z","scenariosCreated":301,"scenariosCompleted":301,"requestsCompleted":301,"latency":{"min":59.4,"max":355.2,"median":62,"p95":76,"p99":84.4},"rps":{"count":301,"mean":20.07},"scenarioDuration":{"min":60,"max":355.8,"median":62.7,"p95":76.7,"p99":85},"scenarioCounts":{"Get response code 200":301},"errors":{},"codes":{"200":301},"matches":0,"customStats":{},"counters":{},"concurrency":1,"pendingRequests":1,"scenariosAvoided":0}'
    },
    {
        'stats_id': '7fe20a63-9b50-4504-9758-dda6e777f4de',
        'test_id': '31017f1e-fd40-4489-a409-a62c67fc60ba',
        'report_id': 'test',
        'runner_id': 'c92c7c98-3be1-4392-bc4e-378732119bbe',
        'stats_time': '2019-03-10T17:24:15.686Z',
        'phase_status': 'intermediate',
        'phase_index': '0',
        'data': '{"timestamp":"2019-03-10T17:24:15.684Z","scenariosCreated":301,"scenariosCompleted":300,"requestsCompleted":300,"latency":{"min":59.4,"max":361.1,"median":61.9,"p95":77.2,"p99":86.3},"rps":{"count":301,"mean":20.07},"scenarioDuration":{"min":59.9,"max":361.7,"median":62.5,"p95":77.8,"p99":87},"scenarioCounts":{"Get response code 200":301},"errors":{},"codes":{"200":300},"matches":0,"customStats":{},"counters":{},"concurrency":2,"pendingRequests":2,"scenariosAvoided":0}'
    },
    {
        'stats_id': '289c183f-6477-44e2-be38-c51c963797ee',
        'test_id': '31017f1e-fd40-4489-a409-a62c67fc60ba',
        'report_id': 'test',
        'runner_id': 'afd625eb-f701-4721-be83-aa85100d69cd',
        'stats_time': '2019-03-10T17:24:16.031Z',
        'phase_status': 'intermediate',
        'phase_index': '0',
        'data': '{"timestamp":"2019-03-10T17:24:16.029Z","scenariosCreated":301,"scenariosCompleted":300,"requestsCompleted":300,"latency":{"min":59.5,"max":347.1,"median":61.7,"p95":77.4,"p99":90.1},"rps":{"count":301,"mean":20.07},"scenarioDuration":{"min":60.2,"max":347.8,"median":62.4,"p95":78.1,"p99":90.8},"scenarioCounts":{"Get response code 200":301},"errors":{},"codes":{"200":300},"matches":0,"customStats":{},"counters":{},"concurrency":2,"pendingRequests":2,"scenariosAvoided":0}'
    },
    {
        'stats_id': '82eab6f5-c0e0-4d82-a246-049817ec2476',
        'test_id': '31017f1e-fd40-4489-a409-a62c67fc60ba',
        'report_id': 'test',
        'runner_id': '3f7b9e01-6160-4df6-9e8a-1d5f6a0ab837',
        'stats_time': '2019-03-10T17:24:45.577Z',
        'phase_status': 'intermediate',
        'phase_index': '0',
        'data': '{"timestamp":"2019-03-10T17:24:31.575Z","scenariosCreated":300,"scenariosCompleted":300,"requestsCompleted":300,"latency":{"min":59.5,"max":117.5,"median":61.2,"p95":72.5,"p99":78.1},"rps":{"count":300,"mean":20.03},"scenarioDuration":{"min":60,"max":118,"median":61.8,"p95":73.1,"p99":78.6},"scenarioCounts":{"Get response code 200":300},"errors":{},"codes":{"200":300},"matches":0,"customStats":{},"counters":{},"concurrency":1,"pendingRequests":1,"scenariosAvoided":0}'
    },
    {
        'stats_id': '93737e55-cebf-44c0-92bb-5cdd6e64635f',
        'test_id': '31017f1e-fd40-4489-a409-a62c67fc60ba',
        'report_id': 'test',
        'runner_id': 'c92c7c98-3be1-4392-bc4e-378732119bbe',
        'stats_time': '2019-03-10T17:24:45.700Z',
        'phase_status': 'intermediate',
        'phase_index': '0',
        'data': '{"timestamp":"2019-03-10T17:24:32.698Z","scenariosCreated":300,"scenariosCompleted":300,"requestsCompleted":300,"latency":{"min":59.3,"max":86.9,"median":61.2,"p95":73.3,"p99":79.7},"rps":{"count":300,"mean":20.04},"scenarioDuration":{"min":59.8,"max":87.4,"median":61.9,"p95":73.9,"p99":80.2},"scenarioCounts":{"Get response code 200":300},"errors":{},"codes":{"200":300},"matches":0,"customStats":{},"counters":{},"concurrency":1,"pendingRequests":1,"scenariosAvoided":0}'
    },
    {
        'stats_id': '875f3e89-593b-4fbf-9228-957ce5c691ff',
        'test_id': '31017f1e-fd40-4489-a409-a62c67fc60ba',
        'report_id': 'test',
        'runner_id': 'afd625eb-f701-4721-be83-aa85100d69cd',
        'stats_time': '2019-03-10T17:24:46.046Z',
        'phase_status': 'intermediate',
        'phase_index': '0',
        'data': '{"timestamp":"2019-03-10T17:24:33.043Z","scenariosCreated":300,"scenariosCompleted":300,"requestsCompleted":300,"latency":{"min":59.5,"max":98.3,"median":61.3,"p95":72.9,"p99":84},"rps":{"count":300,"mean":20.03},"scenarioDuration":{"min":60,"max":98.9,"median":61.9,"p95":73.5,"p99":84.5},"scenarioCounts":{"Get response code 200":300},"errors":{},"codes":{"200":300},"matches":0,"customStats":{},"counters":{},"concurrency":1,"pendingRequests":1,"scenariosAvoided":0}'
    }
];

const PARALLEL_INTERMEDIATE_AND_SUMMARY_ROWS = [
    {
        'stats_id': '30137f7e-23a9-4b4c-9e46-07bc1f1b7c8b',
        'test_id': '31017f1e-fd40-4489-a409-a62c67fc60ba',
        'report_id': 'adf',
        'runner_id': '70a10fae-2f77-41f1-b186-0e748ebd0b5a',
        'stats_time': '2019-03-10T17:29:49.301Z',
        'phase_status': 'intermediate',
        'phase_index': '0',
        'data': '{"timestamp":"2019-03-10T17:29:49.294Z","scenariosCreated":599,"scenariosCompleted":598,"requestsCompleted":598,"latency":{"min":58.9,"max":373.3,"median":60.6,"p95":75,"p99":107.1},"rps":{"count":599,"mean":20},"scenarioDuration":{"min":59.5,"max":373.8,"median":61.3,"p95":75.6,"p99":107.8},"scenarioCounts":{"Get response code 200":599},"errors":{},"codes":{"200":598},"matches":0,"customStats":{},"counters":{},"concurrency":1,"pendingRequests":1,"scenariosAvoided":0}'
    },
    {
        'stats_id': '6b6dc700-a3ea-4d99-b412-1d6941d7c3a8',
        'test_id': '31017f1e-fd40-4489-a409-a62c67fc60ba',
        'report_id': 'adf',
        'runner_id': 'c6be096f-3363-4256-8d64-eb26a7a813e5',
        'stats_time': '2019-03-10T17:29:49.648Z',
        'phase_status': 'intermediate',
        'phase_index': '0',
        'data': '{"timestamp":"2019-03-10T17:29:49.642Z","scenariosCreated":599,"scenariosCompleted":598,"requestsCompleted":598,"latency":{"min":59.2,"max":127.9,"median":60.9,"p95":76.6,"p99":92},"rps":{"count":599,"mean":20},"scenarioDuration":{"min":59.8,"max":134.1,"median":61.6,"p95":77.2,"p99":92.6},"scenarioCounts":{"Get response code 200":599},"errors":{},"codes":{"200":598},"matches":0,"customStats":{},"counters":{},"concurrency":1,"pendingRequests":1,"scenariosAvoided":0}'
    },
    {
        'stats_id': 'b4c0027c-ecfb-4023-94c4-f8681a1a017c',
        'test_id': '31017f1e-fd40-4489-a409-a62c67fc60ba',
        'report_id': 'adf',
        'runner_id': '67a2ab04-38c0-4f7f-9f80-3537a06b1f0c',
        'stats_time': '2019-03-10T17:29:50.570Z',
        'phase_status': 'intermediate',
        'phase_index': '0',
        'data': '{"timestamp":"2019-03-10T17:29:50.565Z","scenariosCreated":599,"scenariosCompleted":598,"requestsCompleted":598,"latency":{"min":59.3,"max":355.5,"median":60.9,"p95":77.7,"p99":87.7},"rps":{"count":599,"mean":20},"scenarioDuration":{"min":59.8,"max":356.1,"median":61.5,"p95":78.3,"p99":88.3},"scenarioCounts":{"Get response code 200":599},"errors":{},"codes":{"200":598},"matches":0,"customStats":{},"counters":{},"concurrency":1,"pendingRequests":1,"scenariosAvoided":0}'
    },
    {
        'stats_id': '3057e9c6-2354-4bcb-a8fa-4966954d1080',
        'test_id': '31017f1e-fd40-4489-a409-a62c67fc60ba',
        'report_id': 'adf',
        'runner_id': '70a10fae-2f77-41f1-b186-0e748ebd0b5a',
        'stats_time': '2019-03-10T17:30:19.317Z',
        'phase_status': 'intermediate',
        'phase_index': '0',
        'data': '{"timestamp":"2019-03-10T17:30:19.312Z","scenariosCreated":601,"scenariosCompleted":601,"requestsCompleted":601,"latency":{"min":59,"max":356.4,"median":60.6,"p95":75.9,"p99":93.3},"rps":{"count":601,"mean":20.03},"scenarioDuration":{"min":59.5,"max":356.9,"median":61.2,"p95":76.4,"p99":93.8},"scenarioCounts":{"Get response code 200":601},"errors":{},"codes":{"200":601},"matches":0,"customStats":{},"counters":{},"concurrency":1,"pendingRequests":1,"scenariosAvoided":0}'
    },
    {
        'stats_id': '2b0c02d0-cb8e-491a-986b-e41b89d7e938',
        'test_id': '31017f1e-fd40-4489-a409-a62c67fc60ba',
        'report_id': 'adf',
        'runner_id': 'c6be096f-3363-4256-8d64-eb26a7a813e5',
        'stats_time': '2019-03-10T17:30:19.666Z',
        'phase_status': 'intermediate',
        'phase_index': '0',
        'data': '{"timestamp":"2019-03-10T17:30:19.662Z","scenariosCreated":601,"scenariosCompleted":601,"requestsCompleted":601,"latency":{"min":59.2,"max":346.1,"median":60.9,"p95":76.1,"p99":92.3},"rps":{"count":601,"mean":20.03},"scenarioDuration":{"min":59.7,"max":346.6,"median":61.5,"p95":76.7,"p99":92.9},"scenarioCounts":{"Get response code 200":601},"errors":{},"codes":{"200":601},"matches":0,"customStats":{},"counters":{},"concurrency":1,"pendingRequests":1,"scenariosAvoided":0}'
    },
    {
        'stats_id': 'cc9b9c00-fd5b-482c-aaa6-0e8770576498',
        'test_id': '31017f1e-fd40-4489-a409-a62c67fc60ba',
        'report_id': 'adf',
        'runner_id': '67a2ab04-38c0-4f7f-9f80-3537a06b1f0c',
        'stats_time': '2019-03-10T17:30:20.588Z',
        'phase_status': 'intermediate',
        'phase_index': '0',
        'data': '{"timestamp":"2019-03-10T17:30:20.583Z","scenariosCreated":601,"scenariosCompleted":601,"requestsCompleted":601,"latency":{"min":59.5,"max":343.7,"median":60.9,"p95":77.1,"p99":93.9},"rps":{"count":601,"mean":20.03},"scenarioDuration":{"min":60,"max":344.2,"median":61.5,"p95":77.9,"p99":94.5},"scenarioCounts":{"Get response code 200":601},"errors":{},"codes":{"200":601},"matches":0,"customStats":{},"counters":{},"concurrency":1,"pendingRequests":1,"scenariosAvoided":0}'
    },
    {
        'stats_id': '877937de-f62f-4d19-90ae-a802c4025ae8',
        'test_id': '31017f1e-fd40-4489-a409-a62c67fc60ba',
        'report_id': 'adf',
        'runner_id': '70a10fae-2f77-41f1-b186-0e748ebd0b5a',
        'stats_time': '2019-03-10T17:30:49.326Z',
        'phase_status': 'intermediate',
        'phase_index': '0',
        'data': '{"timestamp":"2019-03-10T17:30:49.323Z","scenariosCreated":600,"scenariosCompleted":600,"requestsCompleted":600,"latency":{"min":59,"max":349.3,"median":60.3,"p95":69.1,"p99":90.1},"rps":{"count":600,"mean":20.01},"scenarioDuration":{"min":59.4,"max":349.8,"median":60.8,"p95":69.6,"p99":90.6},"scenarioCounts":{"Get response code 200":600},"errors":{},"codes":{"200":600},"matches":0,"customStats":{},"counters":{},"concurrency":1,"pendingRequests":1,"scenariosAvoided":0}'
    },
    {
        'stats_id': '9d796028-46fc-4504-927d-69a47c8c8903',
        'test_id': '31017f1e-fd40-4489-a409-a62c67fc60ba',
        'report_id': 'adf',
        'runner_id': 'c6be096f-3363-4256-8d64-eb26a7a813e5',
        'stats_time': '2019-03-10T17:30:49.674Z',
        'phase_status': 'intermediate',
        'phase_index': '0',
        'data': '{"timestamp":"2019-03-10T17:30:49.671Z","scenariosCreated":600,"scenariosCompleted":600,"requestsCompleted":600,"latency":{"min":59.2,"max":340.8,"median":60.8,"p95":68.5,"p99":91.8},"rps":{"count":600,"mean":20.01},"scenarioDuration":{"min":59.7,"max":341.2,"median":61.3,"p95":69.1,"p99":92.3},"scenarioCounts":{"Get response code 200":600},"errors":{},"codes":{"200":600},"matches":0,"customStats":{},"counters":{},"concurrency":1,"pendingRequests":1,"scenariosAvoided":0}'
    },
    {
        'stats_id': '0e53bfd5-82ed-4481-9b31-b13a65a0ecf3',
        'test_id': '31017f1e-fd40-4489-a409-a62c67fc60ba',
        'report_id': 'adf',
        'runner_id': '67a2ab04-38c0-4f7f-9f80-3537a06b1f0c',
        'stats_time': '2019-03-10T17:30:50.595Z',
        'phase_status': 'intermediate',
        'phase_index': '0',
        'data': '{"timestamp":"2019-03-10T17:30:50.593Z","scenariosCreated":600,"scenariosCompleted":600,"requestsCompleted":600,"latency":{"min":59.3,"max":374,"median":60.8,"p95":71.8,"p99":91.3},"rps":{"count":600,"mean":20.01},"scenarioDuration":{"min":59.8,"max":374.4,"median":61.3,"p95":72.2,"p99":91.8},"scenarioCounts":{"Get response code 200":600},"errors":{},"codes":{"200":600},"matches":0,"customStats":{},"counters":{},"concurrency":1,"pendingRequests":1,"scenariosAvoided":0}'
    },
    {
        'stats_id': 'bfffc67a-fc64-478d-a47d-5112524ba92c',
        'test_id': '31017f1e-fd40-4489-a409-a62c67fc60ba',
        'report_id': 'adf',
        'runner_id': '70a10fae-2f77-41f1-b186-0e748ebd0b5a',
        'stats_time': '2019-03-10T17:31:01.310Z',
        'phase_status': 'final_report',
        'phase_index': '0',
        'data': '{"timestamp":"2019-03-10T17:30:59.800Z","scenariosCreated":2000,"scenariosCompleted":2000,"requestsCompleted":2000,"latency":{"min":58.9,"max":373.3,"median":60.4,"p95":74.5,"p99":90},"rps":{"count":2000,"mean":19.91},"scenarioDuration":{"min":59.4,"max":373.8,"median":61,"p95":75.1,"p99":90.5},"scenarioCounts":{"Get response code 200":2000},"errors":{},"codes":{"200":2000},"matches":0,"customStats":{},"counters":{},"concurrency":3,"pendingRequests":3,"scenariosAvoided":0}'
    },
    {
        'stats_id': '5e6afaff-c4e7-46b1-948a-f1769ed46243',
        'test_id': '31017f1e-fd40-4489-a409-a62c67fc60ba',
        'report_id': 'adf',
        'runner_id': 'c6be096f-3363-4256-8d64-eb26a7a813e5',
        'stats_time': '2019-03-10T17:31:01.663Z',
        'phase_status': 'final_report',
        'phase_index': '0',
        'data': '{"timestamp":"2019-03-10T17:31:00.150Z","scenariosCreated":2000,"scenariosCompleted":2000,"requestsCompleted":2000,"latency":{"min":59.2,"max":346.1,"median":60.8,"p95":75,"p99":91.2},"rps":{"count":2000,"mean":19.91},"scenarioDuration":{"min":59.6,"max":346.6,"median":61.4,"p95":75.7,"p99":91.7},"scenarioCounts":{"Get response code 200":2000},"errors":{},"codes":{"200":2000},"matches":0,"customStats":{},"counters":{},"concurrency":3,"pendingRequests":3,"scenariosAvoided":0}'
    },
    {
        'stats_id': '0b2b5782-4020-4eaa-9acb-d2364843ebe5',
        'test_id': '31017f1e-fd40-4489-a409-a62c67fc60ba',
        'report_id': 'adf',
        'runner_id': '67a2ab04-38c0-4f7f-9f80-3537a06b1f0c',
        'stats_time': '2019-03-10T17:31:02.589Z',
        'phase_status': 'final_report',
        'phase_index': '0',
        'data': '{"timestamp":"2019-03-10T17:31:01.077Z","scenariosCreated":2000,"scenariosCompleted":2000,"requestsCompleted":2000,"latency":{"min":59.3,"max":374,"median":60.9,"p95":75.6,"p99":90.1},"rps":{"count":2000,"mean":19.91},"scenarioDuration":{"min":59.8,"max":374.4,"median":61.4,"p95":76.1,"p99":90.6},"scenarioCounts":{"Get response code 200":2000},"errors":{},"codes":{"200":2000},"matches":0,"customStats":{},"counters":{},"concurrency":3,"pendingRequests":3,"scenariosAvoided":0}'
    }
];